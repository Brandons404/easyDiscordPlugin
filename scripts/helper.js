const logg = (msg) => Call.sendMessage(msg);
const list = (ar) => Call.sendMessage(ar.join(' | '));
const keys = (obj) => Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] '));
const info = (msg) => Call.infoMessage(msg);

module.exports = {
  log: logg,
  list: list,
  keys: keys,
  info: info,
};
