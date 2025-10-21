const crypto = require('crypto');
const { AppError } = require('../middleware/errorHandler');

class PayFastService {
  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    this.passphrase = process.env.PAYFAST_PASSPHRASE;
    this.env = process.env.PAYFAST_ENV || 'sandbox';
    this.baseUrl = this.env === 'production' 
      ? 'https://www.payfast.co.za' 
      : 'https://sandbox.payfast.co.za';
  }

  // Generate payment signature
  generateSignature(data) {
    // Sort data alphabetically
    const sortedData = Object.keys(data)
      .sort()
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});

    // Create parameter string
    let parameterString = '';
    for (const [key, value] of Object.entries(sortedData)) {
      if (value !== '' && key !== 'signature') {
        parameterString += `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}&`;
      }
    }
    
    // Remove last ampersand
    parameterString = parameterString.slice(0, -1);
    
    // Add passphrase if exists
    if (this.passphrase) {
      parameterString += `&passphrase=${encodeURIComponent(this.passphrase)}`;
    }

    // Generate MD5 hash
    return crypto.createHash('md5').update(parameterString).digest('hex');
  }

  // Create payment request
  async createPayment(amount, itemName, returnUrl, cancelUrl, notifyUrl, customData = {}) {
    const paymentData = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: customData.firstName || '',
      name_last: customData.lastName || '',
      email_address: customData.email || '',
      amount: amount.toFixed(2),
      item_name: itemName,
      item_description: customData.description || '',
      custom_int1: customData.companyId || '',
      custom_str1: customData.userId || ''
    };

    // Remove empty values
    Object.keys(paymentData).forEach(key => {
      if (paymentData[key] === '') {
        delete paymentData[key];
      }
    });

    // Generate signature
    paymentData.signature = this.generateSignature(paymentData);

    return {
      paymentUrl: `${this.baseUrl}/eng/process`,
      paymentData
    };
  }

  // Validate ITN (Instant Transaction Notification)
  validateITN(data) {
    const receivedSignature = data.signature;
    const calculatedSignature = this.generateSignature(data);

    if (receivedSignature !== calculatedSignature) {
      throw new AppError('Invalid payment signature', 400);
    }

    return {
      isValid: true,
      paymentStatus: data.payment_status,
      amount: parseFloat(data.amount_gross),
      transactionId: data.pf_payment_id,
      companyId: data.custom_int1,
      userId: data.custom_str1
    };
  }

  // Handle payment success
  async handlePaymentSuccess(transactionData) {
    // Update company wallet balance
    const { Company, Transaction } = require('../models');
    
    const company = await Company.findByPk(transactionData.companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Add funds to wallet
    company.walletBalance += transactionData.amount;
    await company.save();

    // Record transaction
    await Transaction.create({
      companyId: transactionData.companyId,
      type: 'deposit',
      amount: transactionData.amount,
      paymentMethod: 'payfast',
      transactionId: transactionData.transactionId,
      status: 'completed',
      description: `Wallet deposit of R${transactionData.amount} via PayFast`
    });

    return {
      success: true,
      newBalance: company.walletBalance,
      transactionId: transactionData.transactionId
    };
  }
}

module.exports = new PayFastService();