export const PaymentRepository = {
  async createPaymentIntent() {
    return Promise.resolve({ clientSecret: 'pi_mock_secret' });
  },
};
