Helper = {


    makeid : function () {

      var text = ""
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 10; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

        return text;

    },
    
    parse : function (variable) {

    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    ////console.log('Query variable %s not found', variable);


    },

    merge :  function (obj1,obj2){
   
      for (var attrname in obj1) { obj2[attrname] = obj1[attrname]; }
      for (var attrname in obj2) { obj2[attrname] = obj2[attrname]; }
      return obj2;
    
    },
 
	load : function (url, callback) {


		var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    	xobj.open('GET', url, true); 
    	
    	xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {

          	
          	project = JSON.parse(xobj.responseText);

          	callback(project);

           
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
  
            //////console.log(xobj.responseText);
           // ////console.log(project);
          }

    	}
    	
    	xobj.send(null);  

    	return this;
	}
}