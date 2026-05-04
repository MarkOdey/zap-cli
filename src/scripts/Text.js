export function Text(data) {
  this.data = data;

  this.get = function () {
    return data;
  };

  this.run = function (resolver) {
    resolver({ data, weight: 0 });
  };

  this.compare = function (other) {
    if (other == null || other.type !== "Text") return false;
    return data === other.get();
  };
}
