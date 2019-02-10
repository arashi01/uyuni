import React, {useState, useEffect} from 'react';
import Network from '../../../utils/network';

const errorsMessage = {
  'error.invalid_login': 'Either the password or username is incorrect.',
  'account.disabled': 'Your account has been deactivated.',
  'error.user_readonly': 'This user has read only API access. WebUI login is denied.',

};

const useLoginApi = (props) => {

  let [messages, setMessages] = useState([]);
  let [success, setSuccess] = useState(false);
  let [loading, setLoading] = useState(false);

  useEffect(() =>
      window.addEventListener('beforeunload', (e) => {
        if (loading) {
          const confirmationMessage = t('Are you sure you want to close this page while login is in progress?');
          (e || window.event).returnValue = confirmationMessage;
          return confirmationMessage;
        }})
    , []);

  const onLogin = ({ login, password }) => {
    setLoading(false);

    const formData = {
      login: login.trim(),
      password: password.trim(),
    };

    return Network.post('/rhn/manager/api/login', JSON.stringify(formData), 'application/json',)
      .promise.then((data) => {
        setSuccess(data.success);
        setMessages(data.messages && data.messages.map(msg => errorsMessage[msg]));
        setLoading(false);
        return data.success;
      }, (xhr) => {
        const errMessages = xhr.status === 0
          ? [t('Request interrupted or invalid response received from the server. Please try again.')]
          : [Network.errorMessageByStatus(xhr.status)];
        setSuccess(false);
        setMessages(errMessages);
        setLoading(false);
      });
  };


  return {
    onLogin,
    success,
    loading,
    messages
  };
}

export default useLoginApi;
