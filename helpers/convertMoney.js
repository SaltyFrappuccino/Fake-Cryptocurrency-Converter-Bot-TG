const getExchangeRate = require("./getExchangeRate")

module.exports = (amount, from, to) => {
    return getExchangeRate(from, to).then(value => parseFloat(amount / value));
}