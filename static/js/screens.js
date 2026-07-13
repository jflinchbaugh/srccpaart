document.getElementById("refresh-button").addEventListener("click", function () {
  location.reload(true);
});

const list = document.getElementById("list");
const config = JSON.parse(list.dataset.screensConfig);
const baseUrl = `http://${config.subnet}`;
let foundCount = 0;
function reqListener(ev) {
   const url = ev.srcElement.responseURL;
   const screenUrl = url.substring(0, url.length - 12);
   const identifier = ev.srcElement.responseText;
   const item = document.createElement("div");
   item.innerHTML = `<a target="_blank" rel="noopener noreferrer"
                        href="${screenUrl}">
     ${identifier} (${screenUrl})</a>`

   list.appendChild(item);
   foundCount ++;
}

for (let i = 1; i < 256; i++) {
   const req = new XMLHttpRequest();
   req.addEventListener("load", reqListener);
   req.open("GET", `${baseUrl}.${i}:${config.port}/app-identity`);
   req.send();
}
setTimeout(function() {
   document.getElementById("searching").remove();

   if (foundCount <= 0) {
      for (const backup of config.backups) {
         const url = `${baseUrl}.${backup.host}:${config.port}/`;
         const item = document.createElement("div");
         item.innerHTML = `<a target="_blank" rel="noopener noreferrer"
                              href="${url}">
                              backup - ${backup.label}</a>`
         list.appendChild(item);
      }
   }
}, 15000);
