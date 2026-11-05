import { collection, doc, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import { toFirestorePartnerLeadDoc } from '@/lib/firebase/mappers';
import type { PartnerLead } from '@/types/domain';

export const PartnerLeadRepository = {
  async create(input: Omit<PartnerLead, 'id' | 'createdAt' | 'status'>) {
    const ref = doc(collection(db, 'partner_leads'));
    const lead: PartnerLead = {
      id: ref.id,
      createdAt: new Date().toISOString(),
      status: 'new',
      ...input,
    };

    await setDoc(ref, toFirestorePartnerLeadDoc(lead));
    return lead;
  },
};
