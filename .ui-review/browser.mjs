import { writeFile } from 'node:fs/promises';
export async function browserPage(path = '/', width = 1440, height = 1000) {
  const target = await (await fetch('http://127.0.0.1:9334/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let seq = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails);
    if (!data.id) return;
    const entry = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) entry.reject(new Error(JSON.stringify(data.error)));
    else entry.resolve(data.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await new Promise(r => setTimeout(r, 100)); }
    throw new Error(`Timed out: ${expression}`);
  };
  const goto = async url => { await send('Page.navigate', { url: url.startsWith('http') ? url : `http://127.0.0.1:4000${url}` }); await waitFor('document.querySelector("#root")?.innerText.length > 30'); };
  const screenshot = async file => {
    const data = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(new URL(file, import.meta.url), Buffer.from(data.data, 'base64'));
  };
  await goto(path);
  return { send, evaluate, waitFor, goto, screenshot, errors, close: () => ws.close() };
}
if (process.argv[2]) {
  const page = await browserPage(process.argv[2], Number(process.argv[4] || 1440), Number(process.argv[5] || 1000));
  await new Promise(r => setTimeout(r, 1000));
  console.log(await page.evaluate('JSON.stringify({ text: document.body.innerText, width: innerWidth, contentWidth: document.documentElement.scrollWidth })'));
  await page.screenshot(process.argv[3] || 'current.png');
  page.close();
}
