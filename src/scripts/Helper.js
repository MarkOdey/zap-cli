const Helper = {
  makeid() {
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 10; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

  parse(variable) {
    const query = window.location.search.substring(1);
    for (const pair of query.split("&")) {
      const [key, val] = pair.split("=");
      if (decodeURIComponent(key) === variable) return decodeURIComponent(val);
    }
  },

  merge(obj1, obj2) {
    for (const attr in obj1) obj2[attr] = obj1[attr];
    return obj2;
  },

  load(url, callback) {
    const xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open("GET", url, true);
    xobj.onreadystatechange = function () {
      if (xobj.readyState === 4 && xobj.status === 200) {
        callback(JSON.parse(xobj.responseText));
      }
    };
    xobj.send(null);
    return this;
  },
};

export default Helper;
