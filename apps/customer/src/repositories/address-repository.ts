import type { Address } from '@/types/domain';
import { UserRepository } from '@/repositories/user-repository';

export const AddressRepository = {
  subscribe(userId: string, onChange: (addresses: Address[]) => void) {
    return UserRepository.subscribeAddresses(userId, onChange);
  },
};
