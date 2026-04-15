const cron = require('node-cron');  
const prisma = require('./prisma');  
  
cron.schedule('0 11 * * *', async () => {  
  console.log('Ex‚cution du rappel automatique de 11h00...');  
  const delayedRentals = await prisma.rental.findMany({  
    where: {  
      status: 'ONGOING',  
      expectedReturn: { lt: new Date() }  
    },  
    include: { customer: true, items: { include: { item: true } } }  
  });  
  
  if (delayedRentals.length > 0) {  
    console.log(`Alertes de retard pour ${delayedRentals.length} locations.`);  
    // Ici on pourrait envoyer un mail, SMS, ou simplement pr‚parer les alertes pour le dashboard  
  }  
});  
  
module.exports = cron; 
