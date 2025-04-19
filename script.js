w.broadcastReceive();
// Chat theme
var chat = document.getElementsByClassName("chatfield").page_chatfield;
chat.style.fontFamily = "Arial, Times";
chat.style.backgroundColor = "rgba(0,0,255,0.3)";
chat.style.color = "#FFF";
chat.style.textShadow = "0px 0px 5px black";
const start_pos = [512,-1,0,5];
var stick_xy = start_pos;
var stick_id = Math.floor(Math.random() * 9999).toString().padStart(4,"0"); // TODO: id collision check?

/* Events (asterisk means the value is optional):
	!spos charX tileX stickid* - Draws stickman at said X. If stickid is included, the event will be ignored by every client except those who have the matching stick_id.
  !sb4 charX tileX - Erases stickman at said X, sent before !spos requests (unless the requests have a stickid)
  !snew - Adds a new stickman to stick_xy and sends a client message, sent only when the script is run.
*/

// Controls
document.addEventListener("keyup", function(e) {
	switch (e.key) {
    case "ArrowLeft":
			network.cmd(`!sb4${stick_xy[0]}X${stick_xy[2]}`);	// Erase previous stickman...
			stick_xy = coordinateAdd(...stick_xy,0,0,-1,0);
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}`); // ...and draw the next one
			break;
    case "ArrowRight":
			network.cmd(`!sb4${stick_xy[0]}X${stick_xy[2]}`);		
			stick_xy = coordinateAdd(...stick_xy,0,0,1,0);
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}`);		
		  break;
	};
});

// Functions
function stickman(pos,col){
if(!col) { col = 0x000000 };
loc = pos;
writeCharTo("O",0x000000,...loc,true,true,null,false,false,false,false,true);// Head
loc = coordinateAdd(...loc,0,0,-1,1);
writeCharTo("/",0x000000,...loc,true,true,null,false,false,false,false,true);// Left arm
loc = coordinateAdd(...loc,0,0,1,0);
writeCharTo("|",0x000000,...loc,true,true,null,false,false,false,false,true);// Body
loc = coordinateAdd(...loc,0,0,1,0);
writeCharTo('\\',0x000000,...loc,true,true,null,false,false,false,false,true);//Right arm
loc = coordinateAdd(...loc,0,0,-2,1);
writeCharTo("/",0x000000,...loc,true,true,null,false,false,false,false,true);//Left leg
loc = coordinateAdd(...loc,0,0,2,0);
writeCharTo('\\',0x000000,...loc,true,true,null,false,false,false,false,true);//Right leg
};

function stick_erase(pos){
loc = pos;
writeCharTo(" ",0x000000,...loc,true,true,null,false,false,false,false,true)// Head
loc = coordinateAdd(...loc,0,0,-1,1)
writeCharTo(" ",0x000000,...loc,true,true,null,false,false,false,false,true)// Left arm
loc = coordinateAdd(...loc,0,0,1,0)
writeCharTo(" ",0x000000,...loc,true,true,null,false,false,false,false,true)// Body
loc = coordinateAdd(...loc,0,0,1,0)
writeCharTo(' ',0x000000,...loc,true,true,null,false,false,false,false,true)//Right arm
loc = coordinateAdd(...loc,0,0,-2,1)
writeCharTo(" ",0x000000,...loc,true,true,null,false,false,false,false,true)//Left leg
loc = coordinateAdd(...loc,0,0,2,0)
writeCharTo(' ',0x000000,...loc,true,true,null,false,false,false,false,true)//Right leg
};

function write_text(str,col,loc) {
    var scriptloc = loc;
    var originalloc = loc;
    for(let i = 0; i < str.length; i++){
        var char = str.charAt(i);
        var charsintostring = "-" + i+1
        writeCharTo(char,0x000000,...scriptloc);
        scriptloc = coordinateAdd(...scriptloc,0,0,1,0);
    }
}

// Client
// TODO: detect client disconnect
var draw_tx = 0; // tileX
var draw_cx = 0; // charX
var tx_cx = [];

var erase_tx = 0;
var erase_cx = 0;
var erase_tx_cx = 0;

var draw_pos = [];
var erase_pos = [];
var sender_stickid = null;
w.on("cmd",e=>{
	switch (true) {
   case e.data.startsWith("!spos"):
		tx_cx = e.data.slice(5);
		tx_cx = tx_cx.split("X"); // Get tileX and charX (and stick_id if included) from the message
		draw_cx = Number(tx_cx[0]);
		draw_tx = Number(tx_cx[1]);
		draw_pos = [draw_cx,-1,draw_tx,5];
		if(tx_cx[2]) { // If this is a targeted request, then...
			if(tx_cx[2] == stick_id) { // ...only the targeted client will process this request
				stickman(draw_pos);
			}
		} else { // All clients will process this request
			stickman(draw_pos);
    }
		break;
   case e.data.startsWith("!sb4"):
		erase_tx_cx = e.data.slice(4);
		erase_tx_cx = erase_tx_cx.split("X");
		erase_cx = Number(erase_tx_cx[0]);
		erase_tx = Number(erase_tx_cx[1]);
		erase_pos = [erase_cx,-1,erase_tx,5];
		stick_erase(erase_pos);
		break;
   case e.data.startsWith("!snew"):
		sender_stickid = e.data.slice(5);
		stickman(start_pos);
		if(sender_stickid !== stick_id){
			clientChatResponse("Stickman connected"); // TODO: show username/id instead of "Stickman"
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}X${sender_stickid}`); // Send stickman position so the new client can see everyone
		} else {
			clientChatResponse("Connected!");
		}
  };
});

network.cmd(`!snew${stick_id}`);
// w.on("cmd",e=>{console.table(e)}); // use for debugging
