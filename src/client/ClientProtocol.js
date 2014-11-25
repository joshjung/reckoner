var Protocol = module.exports = {},
  HEADER = 5;

var Message = function(id, route,body){
    this.id = id;
    this.route = route;
    this.body = body;
};

Protocol.encode = function(id,route,msg){
  var msgStr = JSON.stringify(msg);

  if (route.length>255) {
    throw new Error('route maxlength is overflow');
  }
  var byteArray = new Uint16Array(HEADER + route.length + msgStr.length),
    index = 0;

  byteArray[index++] = (id>>24) & 0xFF;
  byteArray[index++] = (id>>16) & 0xFF;
  byteArray[index++] = (id>>8) & 0xFF;
  byteArray[index++] = id & 0xFF;
  byteArray[index++] = route.length & 0xFF;

  for(var i = 0;i < route.length; i++){
      byteArray[index++] = route.charCodeAt(i);
  }
  for (var i = 0; i < msgStr.length; i++) {
      byteArray[index++] = msgStr.charCodeAt(i);
  }

  return bt2Str(byteArray,0,byteArray.length);
};

Protocol.decode = function(msg){
  var i, len = msg.length, arr = new Array( len );

  for ( i = 0 ; i < len ; ++i ) {
      arr[i] = msg.charCodeAt(i);
  }

  var index = 0,
    buf = new Uint16Array(arr),
    id = ((buf[index++] <<24) | (buf[index++])  << 16  |  (buf[index++]) << 8 | buf[index++]) >>>0,
    routeLen = buf[HEADER-1],
    route = bt2Str(buf,HEADER, routeLen+HEADER),
    body = bt2Str(buf,routeLen+HEADER,buf.length);  

  return new Message(id, route, body);
};

var bt2Str = function(byteArray,start,end) {
  var result = "";
  for(var i = start; i < byteArray.length && i<end; i++) {
      result = result + String.fromCharCode(byteArray[i]);
  };
  return result;
}