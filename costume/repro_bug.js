const axios = require('axios');

async function reproduce() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    // 1. Get an available item
    const itemsRes = await axios.get('http://localhost:5000/api/items', auth);
    const item = itemsRes.data.find(i => i.status === 'AVAILABLE');
    if (!item) {
        console.log('No available items');
        return;
    }

    // 2. Create rental with partial payment
    const rentalData = {
      firstName: 'Test',
      lastName: 'User',
      phone: '0555000000',
      items: [{ id: item.id }],
      startDate: new Date(),
      expectedReturn: new Date(Date.now() + 86400000 * 2),
      totalAmount: 5000,
      paidAmount: 1000,
      discount: 0,
      guaranteeDocument: 'ID_CARD'
    };

    const rentalRes = await axios.post('http://localhost:5000/api/rentals', rentalData, auth);
    console.log('Rental created:', rentalRes.data);

    // 4. Add a payment
    console.log('\n--- ADDING PAYMENT ---');
    const paymentRes = await axios.post(`http://localhost:5000/api/rentals/${rentalRes.data.id}/payment`, { amount: 1500 }, auth);
    console.log('Payment added:', paymentRes.data);

    // 5. Fetch the rental again
    const getRentalRes2 = await axios.get(`http://localhost:5000/api/rentals`, auth);
    const rentalUpdated = getRentalRes2.data.find(r => r.id === rentalRes.data.id);
    
    console.log('--- UPDATED RENTAL DETAILS ---');
    console.log('Total:', rentalUpdated.totalAmount);
    console.log('Paid:', rentalUpdated.paidAmount);
    console.log('Balance:', rentalUpdated.totalAmount - rentalUpdated.paidAmount);
    
    if (rentalUpdated.totalAmount === rentalUpdated.paidAmount) {
        console.log('BUG DETECTED: Rental is fully paid but should have a balance.');
    } else {
        console.log('Rental shows correct balance.');
    }

    // 6. Test Activate (The suspected bug)
    console.log('\n--- ACTIVATING RENTAL ---');
    const activateRes = await axios.post(`http://localhost:5000/api/rentals/${rentalRes.data.id}/activate`, {}, auth);
    console.log('Rental activated');

    // 7. Fetch the rental again
    const getRentalRes3 = await axios.get(`http://localhost:5000/api/rentals`, auth);
    const rentalActivated = getRentalRes3.data.find(r => r.id === rentalRes.data.id);
    
    console.log('--- ACTIVATED RENTAL DETAILS ---');
    console.log('Total:', rentalActivated.totalAmount);
    console.log('Paid:', rentalActivated.paidAmount);
    console.log('Balance:', rentalActivated.totalAmount - rentalActivated.paidAmount);
    
    if (rentalActivated.paidAmount === rentalActivated.totalAmount) {
        console.log('BUG CONFIRMED: Activation forced full payment!');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

reproduce();
