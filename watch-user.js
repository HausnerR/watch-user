var maxImageWidth = 1000;
var imageQuality = 0.25;

(function () {
    var oldBodyHash = '';
    var lastImgSentDate = 0;
    var socket = new WebSocket("ws://127.0.0.1:8080/", "write-protocol");
    socket.binaryType = 'blob';

    var dataURItoBlob = function (dataURI) {
        var splittedData = dataURI.split(',');

        var mimeString = splittedData[0].split(':')[1].split(';')[0];
        var byteString = atob(splittedData[1]);

        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);

        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], {type : mimeString});
    }

    socket.onopen = function () {
        socket.send(JSON.stringify({t: 'c', x: 0, y: 0}));
        socket.send(JSON.stringify({t: 's', x: window.pageXOffset, y: window.pageYOffset}));
        socket.send(JSON.stringify({t: 'r', w: window.innerWidth, h: window.innerHeight}));

        window.onmousemove = function (e) {
            socket.send(JSON.stringify({t: 'c', x: e.clientX, y: e.clientY}));
        };

        window.onscroll = function () {
            socket.send(JSON.stringify({t: 's', x: window.pageXOffset, y: window.pageYOffset}));
        };

        window.onresize = function () {
            oldBodyHash = "";
            socket.send(JSON.stringify({t: 'r', w: window.innerWidth, h: window.innerHeight}));
        };

        window.onload = function () {
            oldBodyHash = "";
        };

        var scaleCanvas = document.createElement('canvas');

        setInterval(function () {
            var date = Date.now();
            if (lastImgSentDate + 1000 > date) return;

            var bodyHash = sha256(document.body.innerHTML);
            if (bodyHash == oldBodyHash) return;

            oldBodyHash = bodyHash;
            lastImgSentDate = date;

            html2canvas(document.html, {
                onrendered: function(canvas) {
                    var data;

                    if (canvas.width > maxImageWidth) {
                        var w = maxImageWidth;
                        var h = w * canvas.height / canvas.width;

                        scaleCanvas.width = w;
                        scaleCanvas.height = h;
                        scaleCanvas.getContext("2d").drawImage(canvas, 0, 0, w, h);

                        data = scaleCanvas.toDataURL('image/jpeg', imageQuality);
                    } else {
                        data = canvas.toDataURL('image/jpeg', imageQuality);
                    }

                    var blob = dataURItoBlob(data);
                    socket.send(blob);

                    console.log(blob.size);
                }
            });
        }, 100);
    }
})();
