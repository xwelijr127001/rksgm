using System;
using UnityEngine;

namespace Raksa.Bridge
{
    /// <summary>
    /// Satu DTO "flat" untuk semua pesan masuk. Unity JsonUtility tidak mendukung
    /// union/polimorfik, jadi seluruh field opsional disatukan dan hanya field
    /// yang relevan dengan <see cref="type"/> yang dibaca.
    /// </summary>
    [Serializable]
    public class InboundMessage
    {
        public string type;
        public int version;

        // konteks misi
        public string missionId;
        public int roundIndex = -1;
        public string scene;
        public string title;

        // fase & interaksi
        public string phase;
        public bool enabled;
        public string view;

        // tampilan pemain
        public PlayerLookDto look;

        // objek & pilihan
        public BridgeObjectDto[] objects;
        public BridgeSelectionDto[] selections;

        // umpan balik
        public string kind;
        public string stepId;
        public string optionId;

        // kualitas & aksesibilitas
        public bool reducedMotion;
        public string quality;
        public float maxDpr = 2f;

        public int nonce;
    }

    [Serializable]
    public class PlayerLookDto
    {
        public int body;
        public int skin;
        public int hair;
        public int color;
        public string accessory = "none";
    }

    [Serializable]
    public class BridgeObjectDto
    {
        public string stepId;
        public string optionId;
        public string label;
        public string kind;
        public string anchor;
        public bool multi;
    }

    [Serializable]
    public class BridgeSelectionDto
    {
        public string stepId;
        public string[] optionIds;
        /// <summary>Pasangan item->bucket untuk langkah assign (JsonUtility tidak bisa Dictionary).</summary>
        public AssignPairDto[] assign;
        public float angka = float.NaN;
        public bool hasAngka;
    }

    [Serializable]
    public class AssignPairDto
    {
        public string itemId;
        public string bucketId;
    }

    // ------------------------------------------------------------------ keluar

    [Serializable]
    public class OutboundReady
    {
        public string type = "unityReady";
        public int version;
    }

    [Serializable]
    public class OutboundMission
    {
        public string type;
        public string missionId;
        public int roundIndex;
    }

    [Serializable]
    public class OutboundSelection
    {
        public string type;
        public string missionId;
        public int roundIndex;
        public string stepId;
        public string optionId;
        public string bucketId;
        public bool added;
    }

    [Serializable]
    public class OutboundView
    {
        public string type = "cameraViewChanged";
        public string missionId;
        public int roundIndex;
        public string view;
    }

    [Serializable]
    public class OutboundSfx
    {
        public string type = "sfx";
        public string name;
    }

    [Serializable]
    public class OutboundError
    {
        public string type = "interactionError";
        public string code;
        public string message;
        public string missionId;
        public int roundIndex;
    }

    [Serializable]
    public class OutboundPong
    {
        public string type = "pong";
        public int nonce;
    }

    public static class Json
    {
        public static string To<T>(T value)
        {
            return JsonUtility.ToJson(value);
        }

        /// <summary>Parse aman: mengembalikan null bila JSON tidak sah.</summary>
        public static InboundMessage Parse(string json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                var msg = JsonUtility.FromJson<InboundMessage>(json);
                if (msg == null || string.IsNullOrEmpty(msg.type)) return null;
                return msg;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
