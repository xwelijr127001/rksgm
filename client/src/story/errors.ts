import type { StoryErrorCode } from '@shared/story/protocol';
import { bahasaKini, t } from '../i18n';

/**
 * Text for a failed StoryAck. In Indonesian the server's own message is shown (it names specifics such as the room
 * capacity); other UI languages use the translated message for the machine-readable code.
 */
export function storyErrorText(res: { code?: StoryErrorCode; error: string; detail?: string }): string {
  if (bahasaKini() === 'id' || !res.code) return res.error;
  const key = res.code === 'name' && res.detail ? `ruang.nama.${res.detail}` : `ruang.galat.${res.code}`;
  const text = t(key);
  return text === key ? res.error : text;
}
