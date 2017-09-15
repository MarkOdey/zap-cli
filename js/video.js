

var Video = function (data) {

    Emitter.apply(this, arguments);

    this.register('resolve');

    console.log(data);



    var video;

    var self= this;

    //Let's populate the default data;
    this.src = "./"+data.SourceUrl;

    //We set autoplay value if provided
    if(data.autoplay != undefined) {

        this.autoplay = data.autoplay;

    } else {

        this.autoplay = true;
    }

    if(data.loop != undefined) {

        this.loop = data.loop;

    }

    if(data.controls != undefined) {

        this.controls = data.controls;

    }


    // --- public available values

    this.currentTime = 0;
    this.duration = 0;
    
    video = document.createElement("video");

    //We provide its url
    video.src = this.src;  

    //We provide a width and height;
    video.style.position = "absolute";




    video.style.width = "100%";
    video.style.height = "100%";
    video.controls = true;

    video.muted = true;

    video.controls = false;


    //We set autoplay value if provided
    if(this.autoplay != undefined) {

        video.autoplay = this.autoplay;

    }

    if(this.loop != undefined) {

        video.loop = this.loop;

    }

    if(this.controls != undefined) {

        video.controls = this.controls;

    }




    var handleEnded = function (event) {

        console.log('event ended');

        self.destroy();


    }



    window.addEventListener("resize", resizeThrottler, false);

    var resizeTimeout;
    
    function resizeThrottler() {
        // ignore resize events as long as an actualResizeHandler execution is in the queue
        if ( !resizeTimeout ) {

            resizeTimeout = setTimeout(function() {
                resizeTimeout = null;
                 render();
             
               // The actualResizeHandler will execute at a rate of 15fps
            }, 66);

        }
    }


  function computeFitLayout(videoWidth, videoHeight, canvasWidth, canvasHeight) {

            // Ratio of video
            var videoRatio = videoWidth / videoHeight;

            if(isNaN(videoRatio)) return false;
            //
            var result = {};
            // Ratio of canvas
            var canvasRatio = canvasWidth / canvasHeight;


            if (canvasRatio > videoRatio) {

                // New video width
                result.width = canvasWidth;
                // New video height
                result.height = (1/videoRatio) * canvasWidth;
                // Video offset from the top
                result.top = - (result.height - canvasHeight) / 2;
                // Video offset from left
                result.left = 0;
                // Video offset from the bottom
                result.bottom = 0;

            } else {    // The canvas height is more than the canvas width

                // New video height
                result.height = canvasHeight;
                // New video width
                result.width = videoRatio * canvasHeight;
                // Offset from the left
                result.left = -(result.width - canvasWidth) / 2;
                // Offset from the top
                result.top = 0;
                // Offset from bottom
                result.bottom = 0;

            }

            return result;
        }

  function render() {


       /* console.log(data.ImageHeight);
        console.log(data.ImageWidth);
        console.log(document.body.clientWidth);
        console.log(document.body.clientHeight);*/


        var frame = computeFitLayout(data.ImageWidth, data.ImageHeight, document.body.clientWidth, document.body.clientHeight)

        console.log(frame);
        video.style.position='absolute';

        video.style.width=Math.round(frame.width)+"px";
        video.style.height=Math.round(frame.height)+"px";

        video.style.top=Math.round(frame.top)+"px";
        video.style.left=Math.round(frame.left)+"px";



        console.log('window resized');
  }


    //   ---  Time Update --- \\


    ///This will be overridden by the system you don't need to instantiated ortouch it.
    //this.onTimeUpdate = function() { };

    var handleTimeUpdate = function (event) {
        //console.log(event);

        //We give it the current time in the public level so you can perform match.
        self.currentTime = video.currentTime;

        if(video.currentTime >  video.duration-3 ) {

            self.resolve();
            
        }
        
    }

    //   ---  PLAY  --- \\

    this.play = function () {
        //console.log("play is invoked");

        video.play();
    };

    //This will be overriden
    this.onPlay = function () {};


    var handlePlay = function (event) {
        self.onPlay();
    }

    //   ---  PAUSE  --- \\

    this.pause = function () {
        video.pause();
    }

    //This will be overriden
    this.onPause = function () {};

    var handlePause = function (e) {
        self.onPause();
    }


    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    video.addEventListener('timeupdate', handleTimeUpdate);

    this.resolve = function () {

        self.emit('resolve');

        self.destroy();
        
    }

    this.destroy = function () {


        Mediator.root.removeChild(video);

        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('timeupdate', handleTimeUpdate);

      //  this.resolve();


    }




    this.run = function () {


        Mediator.root.appendChild(video);
        render();
        
    }
    
}

Video.validate = function (data) {

    if(data.FileType == 'MP4' && data.MIMEType.indexOf("video") !=-1) {

        return true;
    }

    return false;

}