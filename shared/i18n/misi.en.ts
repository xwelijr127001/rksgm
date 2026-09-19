import type { KamusMisi } from './misi';

/** Konten misi dalam bahasa Inggris (lapisan di atas shared/missions.ts; kunci = id misi). */
export const MISI_EN: KamusMisi = {
  // ---------------------------------------------------------------- TUTORIAL
  tutorial: {
    title: 'Tapping Practice',
    productLabel: 'Practice',
    location: 'Raksa Office',
    story:
      'A short practice before the real game. Tap an object in the picture (or a choice in the list) to select it, then press Submit. Practice answers do not count towards the competition score.',
    instruction: 'Tap the safety helmet in the picture, then press Submit.',
    interactionLabel: 'Practice',
    rakiBriefing: "Hi! I'm Raki. Have a go first to see how to play.",
    learning:
      'How to play: tap to select, check your choice, then press Submit Answer before time runs out.',
    steps: {
      latihan: {
        prompt: 'Tap the safety helmet',
        opsi: {
          helm: { label: 'Safety helmet' },
          kopi: { label: 'Coffee' },
          kucing: { label: 'Cat' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 1
  'm01-parkir': {
    title: 'Not-So-Smooth Parking',
    productLabel: 'AUTO - Motor Vehicle',
    location: 'City Car Park',
    story:
      "A customer's car was bumped in the car park. Everyone is safe and the vehicle is in a safe place.",
    instruction: 'Choose the next action.',
    interactionLabel: 'Choose one answer',
    rakiBriefing: 'Relax, everyone is safe. Now decide the right first step.',
    learning: 'Clear documentation and a clear report help the claims handling process.',
    steps: {
      s1: {
        prompt: 'What is the next action?',
        opsi: {
          dokumentasi: { label: 'Document the damage and report the incident through the claims channel' },
          perbaiki: { label: 'Repair it straight away without documentation or coordination' },
          buang: { label: 'Throw away the damaged parts' },
          abaikan: { label: 'Ignore the incident because the vehicle can still be driven' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 2
  'm02-detektif-penyok': {
    title: 'Dent Detective',
    productLabel: 'AUTO - Motor Vehicle',
    location: 'Partner Workshop',
    story: 'The impact was on the front-left part of the vehicle.',
    instruction: 'Photograph three relevant pieces of evidence from the six choices in the workshop.',
    interactionLabel: 'Choose 3 pieces of evidence',
    rakiBriefing: 'The right evidence makes the inspection faster. Choose just three.',
    learning: 'Evidence should help link the vehicle, the location of the damage, and the incident.',
    steps: {
      bukti: {
        prompt: 'Choose 3 relevant pieces of evidence',
        hint: 'Choosing an irrelevant card lowers your accuracy.',
        opsi: {
          'foto-full': { label: 'Photo of the whole vehicle' },
          'foto-depan-kiri': { label: 'Close-up photo of the front-left damage' },
          'foto-identitas': { label: 'Photo of the vehicle identity (number plate & chassis number)' },
          'foto-makanan': { label: 'Photo of lunch at a café' },
          'foto-selfie': { label: 'Selfie in the car park' },
          'foto-kucing': { label: 'Photo of a cat on the car bonnet' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 3
  'm03-berkas-ruko': {
    title: 'The Shophouse File',
    productLabel: 'FIRE / PROPERTY - Fire & Property',
    location: 'Shophouse on Jalan Melati',
    story:
      'The fire has been dealt with and the site has been declared safe. The customer wants to prepare an initial report.',
    instruction: 'Put the four relevant documents into the report folder.',
    interactionLabel: 'Put 4 documents in the folder',
    rakiBriefing: 'The initial report needs four items. See the checklist next to the folder.',
    learning: 'An initial report needs evidence that is consistent and easy to check.',
    checklist: ['Sequence of events', 'Damage photos', 'List of affected items', 'Loss estimate'],
    steps: {
      berkas: {
        prompt: 'Put in the documents that match the checklist',
        hint: 'Two cards are irrelevant; putting them in lowers your accuracy.',
        opsi: {
          kronologi: { label: 'Sequence of events' },
          'foto-kerusakan': { label: 'Photos of the shophouse damage' },
          'daftar-barang': { label: 'List of affected items' },
          estimasi: { label: 'Loss estimate' },
          brosur: { label: 'Shop promotion brochure' },
          'struk-kopi': { label: "Renovation team's coffee receipt" },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 4
  'm04-excavator': {
    title: 'The Tilted Excavator',
    productLabel: 'HVC - Heavy Equipment',
    location: 'New Road Project',
    story: 'An excavator slipped at the project site. The area has been secured.',
    instruction: 'Tap the four pieces of information needed to prepare for the inspection.',
    interactionLabel: 'Find 4 pieces of information in the scene',
    rakiBriefing: 'Tap the parts of the scene that give information for the inspection. There are four.',
    learning: "The equipment's identity and the sequence of events help in inspecting the incident.",
    steps: {
      temuan: {
        prompt: 'Tap 4 pieces of information in the scene',
        hint: 'Findings go into the notes panel. Irrelevant objects lower your accuracy.',
        opsi: {
          seri: {
            label: 'Unit identity / serial number',
            desc: 'Serial number plate on the excavator body',
          },
          posisi: {
            label: 'Unit position during the incident',
            desc: 'Unit tilted at the edge of the excavation',
          },
          rusak: {
            label: 'Damaged parts',
            desc: 'Boom & undercarriage scratched',
          },
          operator: {
            label: "Operator's statement",
            desc: 'The operator is ready to give the sequence of events',
          },
          spanduk: { label: 'Project banner' },
          warung: { label: 'Coffee stall at the edge of the site' },
          awan: { label: 'Clouds in the sky' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 5
  'm05-polis-mana': {
    title: 'Which Policy Is It?',
    productLabel: 'AUTO - Motor Vehicle',
    location: 'Raksa Office',
    story:
      'Two cars, each worth Rp200 million, have each suffered impact damage of Rp4 million. Assume both policies are active and the other conditions in the simulation are met.',
    instruction: 'Match each case with a conclusion based on the policy card.',
    interactionLabel: 'Match cases with conclusions',
    rakiBriefing: 'Same damage, different policy cards. Read the cards first, okay?',
    learning: 'Similar damage can lead to different handling because the policy cover is different.',
    policyCards: {
      'polis-a': {
        title: 'Policy Card A',
        subtitle: 'Comprehensive (simulation)',
        rows: [
          { label: 'Vehicle value', value: 'Rp200.000.000' },
          { label: 'Impact damage', value: 'Covered, subject to the card terms' },
          { label: 'Policy status', value: 'Active' },
        ],
        note: 'Simulation card for decision-making practice.',
      },
      'polis-b': {
        title: 'Policy Card B',
        subtitle: 'TLO - Total Loss Only (simulation)',
        rows: [
          { label: 'Vehicle value', value: 'Rp200.000.000' },
          { label: 'Total loss threshold', value: 'At least 75% of the vehicle value' },
          { label: 'Damage in this case', value: 'Rp4.000.000 (2% of the vehicle value)' },
        ],
        note: 'Simulation card for decision-making practice.',
      },
    },
    steps: {
      cocok: {
        prompt: 'Choose a conclusion for each case',
        item: {
          'kasus-a': { label: 'Case A - Policy Card A (Comprehensive)' },
          'kasus-b': { label: 'Case B - Policy Card B (TLO)' },
        },
        kategori: {
          lanjut: { label: 'Can proceed to assessment of the impact damage' },
          'tidak-ambang': { label: 'The damage does not meet the TLO threshold in the simulation' },
          'perlu-data': { label: 'More information is needed before concluding' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 6
  'm06-paket-penyok': {
    title: 'The Package Arrived Dented',
    productLabel: 'CARGO - Goods in Transit',
    location: 'Port & Logistics',
    story:
      'The shipping list records 10 crates. The proof of receipt records 8 crates, and 2 of the crates received have damaged packaging.',
    instruction: 'Compare the documents, fill in two numbers, then choose the follow-up action.',
    interactionLabel: 'Compare the documents',
    rakiBriefing: "Compare the shipping list with the proof of receipt. The numbers don't match!",
    learning: 'The number of items, their condition on receipt, and the documents need to be checked together.',
    tables: {
      pengiriman: {
        title: 'Shipping List',
        rows: [
          { label: 'Crates shipped', value: '10 crates' },
          { label: 'Type of goods', value: 'Machine components' },
          { label: 'Loading date', value: '03 Sep 2026' },
        ],
      },
      penerimaan: {
        title: 'Proof of Receipt',
        rows: [
          { label: 'Crates received', value: '8 crates' },
          { label: 'Damaged packaging', value: '2 crates' },
          { label: 'Date received', value: '11 Sep 2026' },
        ],
      },
      foto: {
        title: 'Photos on Receipt',
        rows: [
          { label: 'Photo 1', value: "Stack of crates in the receiver's warehouse" },
          { label: 'Photo 2', value: 'Crate #4 packaging dented & open' },
          { label: 'Photo 3', value: 'Crate #7 packaging wet & dented' },
        ],
      },
    },
    steps: {
      selisih: {
        prompt: 'What is the difference in the number of crates?',
        unit: 'crates',
      },
      rusak: {
        prompt: 'How many crates were received with damaged packaging?',
        unit: 'crates',
      },
      tindak: {
        prompt: 'Choose the follow-up action',
        opsi: {
          dokumentasi: {
            label: 'Document the discrepancy and complete the transport documents for inspection',
          },
          'bayar-semua': {
            label: 'Conclude that the whole loss is automatically covered and request full payment',
          },
          tolak: { label: 'Reject the whole shipment without recording anything' },
          diam: { label: 'Just accept it because the goods have arrived' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 7
  'm07-banjir-gudang': {
    title: 'Flood at the Warehouse',
    productLabel: 'FIRE / PROPERTY - Fire & Property',
    location: 'Sentra Niaga Warehouse',
    story: 'The damage was caused by a flood. Two simulation policies are available to compare.',
    instruction: 'Choose the policy that has relevant cover in the simulation, then choose the reason.',
    interactionLabel: 'Compare two policies',
    rakiBriefing: 'Pay attention to the extension and the policy period.',
    learning: 'The type of risk and the policy period must be checked.',
    policyCards: {
      'polis-a': {
        title: 'Policy A',
        subtitle: 'Property All Risk (simulation)',
        rows: [
          { label: 'Flood extension', value: 'Listed' },
          { label: 'Policy period', value: '01 Jan 2026 - 31 Dec 2026' },
          { label: 'Date of incident', value: '05 Sep 2026 (within the period)' },
          { label: 'Insured object', value: 'Sentra Niaga Warehouse' },
        ],
      },
      'polis-b': {
        title: 'Policy B',
        subtitle: 'Standard fire (simulation)',
        rows: [
          { label: 'Flood extension', value: 'Not listed' },
          { label: 'Policy period', value: '01 Jan 2026 - 31 Dec 2026' },
          { label: 'Date of incident', value: '05 Sep 2026 (within the period)' },
          { label: 'Insured object', value: 'Sentra Niaga Warehouse' },
        ],
      },
    },
    steps: {
      polis: {
        prompt: 'Which policy has relevant cover in the simulation?',
        opsi: {
          'polis-a': { label: 'Policy A' },
          'polis-b': { label: 'Policy B' },
          keduanya: { label: 'Both are the same' },
        },
      },
      alasan: {
        prompt: 'Choose the correct reason',
        opsi: {
          'perluasan-periode': {
            label: 'The flood extension is listed and the policy period covers the date of the incident',
          },
          'nilai-besar': { label: 'Because its sum insured is higher' },
          'dekat-kantor': { label: 'Because the warehouse is closer to the office' },
          'selalu-dijamin': { label: 'Because flood is always covered under every property policy' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 8
  'm08-benturan-keausan': {
    title: 'Impact or Wear and Tear?',
    productLabel: 'HVC - Heavy Equipment',
    location: 'Heavy Equipment Warehouse',
    story:
      'A forklift has suffered an impact. Photos show new damage to a panel, while an earlier service record says another component was already worn.',
    instruction: 'Sort each piece of evidence into the right category.',
    interactionLabel: 'Classify the evidence',
    rakiBriefing: 'Separate what is related to the incident from what was already there before it.',
    learning: 'Decisions need to follow the evidence; some parts need more information.',
    policyCards: {
      'kartu-hvc': {
        title: 'HVC Policy Card - Heavy Equipment (simulation)',
        rows: [
          { label: 'Impact', value: 'Covered, subject to the terms' },
          { label: 'Gradual wear and tear', value: 'Excluded' },
          { label: 'Insured object', value: 'Forklift GT-220' },
        ],
      },
    },
    steps: {
      klasifikasi: {
        prompt: 'Decide the category for each piece of evidence',
        item: {
          panel: { label: 'Panel damaged after the impact' },
          'catatan-aus': { label: 'Service record: component was already worn before the incident' },
          internal: { label: 'Internal damage, link to the impact not yet clear' },
        },
        kategori: {
          terkait: { label: 'Inspect as damage related to the incident' },
          sebelumnya: { label: 'Set aside as a condition before the incident' },
          teknis: { label: 'Further technical inspection needed' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- MISI 9
  'm09-hitung-teliti': {
    title: 'Calculate with Care',
    productLabel: 'HVC - Heavy Equipment',
    location: 'Calculation Desk, Raksa Office',
    story:
      'The approved loss is Rp100.000.000. The deductible is 10% of that loss, with a minimum of Rp5.000.000. There are no other limits or deductions in this question.',
    instruction: 'Set out the calculation of the deductible and the final result.',
    interactionLabel: 'Build the calculation',
    rakiBriefing: "Check what the percentage is based on and the minimum amount. Don't mix them up.",
    learning: 'Pay attention to what the percentage is based on and to the minimum amount.',
    tables: {
      data: {
        title: 'Simulation Data',
        rows: [
          { label: 'Approved loss', value: 'Rp100.000.000' },
          { label: 'Deductible', value: '10% of that loss' },
          { label: 'Minimum deductible', value: 'Rp5.000.000' },
          { label: 'Other limits / deductions', value: 'None' },
        ],
      },
    },
    steps: {
      persen: {
        prompt: '10% x Rp100.000.000 = ?',
      },
      risiko: {
        prompt: 'The deductible that applies',
        hint: 'Compare the percentage result with the minimum amount.',
      },
      hasil: {
        prompt: 'Final result of the simulation',
      },
    },
  },

  // ---------------------------------------------------------------- MISI 10
  'm10-grand-mission': {
    title: 'Grand Mission',
    productLabel: 'AUTO + HVC (Heavy Equipment) + PROPERTY',
    location: 'City Business Complex',
    story:
      'A flood has affected three assets in a business complex. Everyone is safe. Check the three cases, then decide the next steps.',
    instruction: 'Three stages: match the product, decide what to check, then choose the follow-up action.',
    interactionLabel: 'Three decision stages',
    rakiBriefing: 'Last mission! Check the insured object, cover, period, and evidence before deciding.',
    learning: 'Check the insured object, cover, period, and evidence before deciding the next step.',
    policyCards: {
      'kasus-a': {
        title: 'Case A - Company car',
        subtitle: 'Simulation policy card',
        rows: [
          { label: 'Insured object', value: 'Company car B 1234 XX' },
          { label: 'Flood', value: 'Not covered on the card' },
          { label: 'Policy status', value: 'Active' },
        ],
      },
      'kasus-b': {
        title: 'Case B - Heavy equipment',
        subtitle: 'Simulation policy card',
        rows: [
          { label: 'Flood', value: 'Covered on the card' },
          { label: 'Serial number on the policy card', value: 'EX-4471' },
          { label: 'Serial number on the report', value: 'EX-4417 (different)' },
        ],
      },
      'kasus-c': {
        title: 'Case C - Warehouse',
        subtitle: 'Simulation policy card',
        rows: [
          { label: 'Flood extension', value: 'Active on the date of the incident' },
          { label: 'Insured object', value: 'Matches the policy card' },
          { label: 'Initial evidence', value: 'Complete' },
        ],
      },
    },
    steps: {
      produk: {
        prompt: 'Stage 1 - Match the product for each case',
        item: {
          'kasus-a': { label: 'Case A - Company car' },
          'kasus-b': { label: 'Case B - Heavy equipment' },
          'kasus-c': { label: 'Case C - Warehouse' },
        },
        kategori: {
          AUTO: { label: 'AUTO' },
          HVC: { label: 'HVC (Heavy Equipment)' },
          PROPERTY: { label: 'FIRE / PROPERTY' },
          CARGO: { label: 'CARGO' },
        },
      },
      periksa: {
        prompt: 'Stage 2 - What information needs to be checked?',
        item: {
          'kasus-a': { label: 'Case A - Company car' },
          'kasus-b': { label: 'Case B - Heavy equipment' },
          'kasus-c': { label: 'Case C - Warehouse' },
        },
        kategori: {
          jaminan: { label: 'Flood cover on the policy card' },
          identitas: { label: 'Whether the unit serial number matches' },
          bukti: { label: 'Completeness of the initial evidence & whether the object matches' },
        },
      },
      tindak: {
        prompt: 'Stage 3 - Choose the follow-up action',
        item: {
          'kasus-a': { label: 'Case A - Company car' },
          'kasus-b': { label: 'Case B - Heavy equipment' },
          'kasus-c': { label: 'Case C - Warehouse' },
        },
        kategori: {
          'luar-jaminan': { label: 'Outside the cover listed on the simulation card' },
          klarifikasi: { label: 'Clarify the unit identity before continuing the assessment' },
          survei: { label: 'Proceed to survey / assessment according to procedure' },
        },
      },
    },
  },

  // ---------------------------------------------------------------- RONDE PENENTUAN
  'm11-penentuan': {
    title: 'Tie-break Round',
    productLabel: 'AUTO - Motor Vehicle',
    location: 'Raksa Office',
    story:
      'A tie on the podium! One quick question decides the winner. A customer phones after their vehicle was bumped, and everyone is safe.',
    instruction: 'Choose the first piece of information the officer most needs to record.',
    interactionLabel: 'Choose one answer - be quick!',
    rakiBriefing: 'Tie-break round! The fastest correct answer wins.',
    learning:
      'The identity of the insured object and the sequence of events are the first and most important things to record.',
    steps: {
      penentuan: {
        prompt: 'The first piece of information that most needs to be recorded',
        opsi: {
          'identitas-kronologi': { label: 'Vehicle identity and a brief sequence of events' },
          'warna-favorit': { label: "The customer's favourite colour" },
          'harga-bengkel': { label: 'Price list of the nearest workshop' },
          'jadwal-servis': { label: "Next year's service schedule" },
        },
      },
    },
  },
};
