// Example for React Native / Android side
import SendSMS from 'react-native-sms';

const triggerSMSFallback = (lat, lon) => {
  SendSMS.send({
    body: `SOS ALERT! My Location: https://www.google.com/maps?q=${lat},${lon}. Phone: 08012345678`,
    recipients: ['767', '112'], // Lagos Emergency Numbers
    successTypes: ['sent', 'queued'],
  }, (completed, cancelled, error) => {
    if (completed) {console.log('SMS Callback: ', completed)};
    if (cancelled) {console.log('Report Cancelled: ', cancelled)};
    if (error) {console.log('Error: ', error)}
  });
};



export default triggerSMSFallback