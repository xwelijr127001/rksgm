using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using Raksa.Generated;
using UnityEngine;

namespace Raksa.Bridge
{
    /// <summary>
    /// Satu-satunya pintu masuk/keluar pesan antara React dan Unity.
    /// Dipasang pada GameObject bernama "RaksaBridge" (dipertahankan antar scene).
    ///
    /// React memanggil: unityInstance.SendMessage("RaksaBridge", "Receive", json)
    /// Unity mengirim : RaksaBridgeSend(json) -> window.RaksaUnityReceive(json)
    ///
    /// Semua pesan divalidasi: versi, bentuk, fase, dan ID objek. Pesan dari misi
    /// atau ronde yang sudah lewat DIBUANG, bukan dieksekusi.
    /// </summary>
    public class RaksaBridge : MonoBehaviour
    {
        public const int BridgeVersion = 1;
        private const string BridgeObjectName = "RaksaBridge";

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void RaksaBridgeSend(string json);
        [DllImport("__Internal")] private static extern void RaksaBridgeLog(string message);
        [DllImport("__Internal")] private static extern float RaksaBridgeGetDevicePixelRatio();
#else
        private static void RaksaBridgeSend(string json) { Debug.Log("[bridge->js] " + json); }
        private static void RaksaBridgeLog(string message) { Debug.Log("[unity] " + message); }
        private static float RaksaBridgeGetDevicePixelRatio() { return 1f; }
#endif

        public static RaksaBridge Instance { get; private set; }

        /// <summary>Handler pesan yang sudah divalidasi. Dipasang oleh GameRoot.</summary>
        public event Action<InboundMessage> OnMessage;

        private bool _initialized;
        private readonly List<InboundMessage> _pending = new List<InboundMessage>(16);

        /// <summary>Konteks misi yang sedang aktif; dipakai menolak pesan kedaluwarsa.</summary>
        public string CurrentMissionId { get; private set; }
        public int CurrentRoundIndex { get; private set; } = -1;
        public string CurrentPhase { get; private set; } = "LOBBY";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Satu instance saja selama sesi bermain.
                Destroy(gameObject);
                return;
            }
            Instance = this;
            gameObject.name = BridgeObjectName;
            DontDestroyOnLoad(gameObject);
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                OnMessage = null;
                Instance = null;
            }
        }

        // ------------------------------------------------------------ masuk

        /// <summary>Dipanggil dari JavaScript lewat SendMessage.</summary>
        public void Receive(string json)
        {
            var msg = Json.Parse(json);
            if (msg == null)
            {
                SendError("lain", "pesan tidak dapat dibaca", null, -1);
                return;
            }

            if (msg.type == "initialize")
            {
                if (msg.version != BridgeVersion)
                {
                    SendError("lain", "versi bridge tidak cocok: js=" + msg.version + " unity=" + BridgeVersion, null, -1);
                    return;
                }
                _initialized = true;
                Dispatch(msg);
                FlushPending();
                SendReady();
                return;
            }

            if (!_initialized)
            {
                // React mengirim state sebelum initialize: tahan, jangan dibuang.
                if (_pending.Count < 64) _pending.Add(msg);
                return;
            }

            if (!Validate(msg)) return;
            Dispatch(msg);
        }

        private void FlushPending()
        {
            for (int i = 0; i < _pending.Count; i++)
            {
                if (Validate(_pending[i])) Dispatch(_pending[i]);
            }
            _pending.Clear();
        }

        /// <summary>Validasi bentuk pesan, misi, dan ID objek.</summary>
        private bool Validate(InboundMessage msg)
        {
            switch (msg.type)
            {
                case "loadMission":
                    if (!RaksaIds.IsKnownMission(msg.missionId))
                    {
                        SendError("misi-tidak-dikenal", "missionId tidak dikenal: " + msg.missionId, msg.missionId, msg.roundIndex);
                        return false;
                    }
                    if (msg.roundIndex < 0)
                    {
                        SendError("lain", "roundIndex tidak sah", msg.missionId, msg.roundIndex);
                        return false;
                    }
                    if (msg.objects != null)
                    {
                        for (int i = 0; i < msg.objects.Length; i++)
                        {
                            var o = msg.objects[i];
                            if (o == null || string.IsNullOrEmpty(o.stepId) || string.IsNullOrEmpty(o.optionId))
                            {
                                SendError("objek-tidak-dikenal", "objek tanpa stepId/optionId", msg.missionId, msg.roundIndex);
                                return false;
                            }
                            if (string.IsNullOrEmpty(o.anchor)) o.anchor = o.stepId + ":" + o.optionId;
                            if (!RaksaIds.IsKnownAnchor(msg.missionId, o.anchor))
                            {
                                SendError("objek-tidak-dikenal", "anchor tidak dikenal: " + o.anchor, msg.missionId, msg.roundIndex);
                                return false;
                            }
                        }
                    }
                    return true;

                case "setPhase":
                case "restoreSelections":
                case "setInteractionEnabled":
                case "showFeedback":
                case "setCameraView":
                    // Pesan misi harus cocok dengan misi yang sedang dimuat.
                    if (string.IsNullOrEmpty(msg.missionId)) return false;
                    if (CurrentMissionId == null)
                    {
                        // Belum ada misi: hanya setPhase yang berguna (mis. LOBBY/TUTORIAL).
                        return msg.type == "setPhase";
                    }
                    if (msg.missionId != CurrentMissionId || msg.roundIndex != CurrentRoundIndex)
                    {
                        // Pesan kedaluwarsa: diabaikan tanpa error berisik.
                        return false;
                    }
                    return true;

                case "setPlayerAppearance":
                case "setReducedMotion":
                case "setQuality":
                case "ping":
                    return true;

                default:
                    return false;
            }
        }

        private void Dispatch(InboundMessage msg)
        {
            if (msg.type == "loadMission")
            {
                CurrentMissionId = msg.missionId;
                CurrentRoundIndex = msg.roundIndex;
            }
            else if (msg.type == "setPhase")
            {
                CurrentPhase = msg.phase ?? CurrentPhase;
            }
            else if (msg.type == "ping")
            {
                SendPong(msg.nonce);
                return;
            }

            var handler = OnMessage;
            if (handler != null) handler(msg);
        }

        // ------------------------------------------------------------ keluar

        private static void Emit(string json)
        {
            RaksaBridgeSend(json);
        }

        public void SendReady()
        {
            Emit(Json.To(new OutboundReady { version = BridgeVersion }));
        }

        public void SendMissionReady(string missionId, int roundIndex)
        {
            Emit(Json.To(new OutboundMission { type = "missionReady", missionId = missionId, roundIndex = roundIndex }));
        }

        public void SendObjectSelected(string stepId, string optionId, string bucketId)
        {
            Emit(Json.To(new OutboundSelection
            {
                type = "objectSelected",
                missionId = CurrentMissionId,
                roundIndex = CurrentRoundIndex,
                stepId = stepId,
                optionId = optionId,
                bucketId = bucketId,
            }));
        }

        public void SendEvidenceToggled(string stepId, string optionId, bool added)
        {
            Emit(Json.To(new OutboundSelection
            {
                type = "evidenceToggled",
                missionId = CurrentMissionId,
                roundIndex = CurrentRoundIndex,
                stepId = stepId,
                optionId = optionId,
                added = added,
            }));
        }

        public void SendCameraView(string view)
        {
            Emit(Json.To(new OutboundView
            {
                missionId = CurrentMissionId,
                roundIndex = CurrentRoundIndex,
                view = view,
            }));
        }

        public void SendSfx(string name)
        {
            Emit(Json.To(new OutboundSfx { name = name }));
        }

        public void SendError(string code, string message, string missionId, int roundIndex)
        {
            Emit(Json.To(new OutboundError
            {
                code = code,
                message = message,
                missionId = missionId,
                roundIndex = roundIndex,
            }));
        }

        private void SendPong(int nonce)
        {
            Emit(Json.To(new OutboundPong { nonce = nonce }));
        }

        public static float DevicePixelRatio()
        {
            return RaksaBridgeGetDevicePixelRatio();
        }

        public static void Log(string message)
        {
            RaksaBridgeLog(message);
        }
    }
}
