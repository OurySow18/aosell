export const DeliveryRepository = {
  async track(orderId: string) {
    return Promise.resolve({ orderId, status: 'out_for_delivery' });
  },
};
