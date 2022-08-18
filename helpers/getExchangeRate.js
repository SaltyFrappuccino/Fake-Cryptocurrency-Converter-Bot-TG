const { default: axios } = require("axios");

module.exports = (from, to) => {
  return axios
    .get(
      `https://api.exchangerate.host/latest?base=${from}&symbols=${to}&source=crypto`
    )
    .then((response) => {
      if (response.data?.success === true) {
        return parseFloat(response.data?.rates[to]);
      }
    });
};