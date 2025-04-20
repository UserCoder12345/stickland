w.broadcastReceive();
// Chat theme
var chat = document.getElementsByClassName("chatfield").page_chatfield;
chat.style.fontFamily = "Arial, Times";
chat.style.backgroundColor = "rgba(0,0,255,0.3)";
chat.style.color = "#FFF";
chat.style.textShadow = "0px 0px 5px black";
const start_pos = [512,-1,0,5]; // change if needed
var stick_xy = start_pos;
var stick_id = Math.floor(Math.random() * 9999).toString().padStart(4,"0"); // TODO: id collision check?
var stick_color = 0x000000;
w.doGoToCoord(0,128); // change if needed

/* Events (asterisk means the value is optional):
	!spos charX tileX stickid* color* - Draws stickman at said X. If stickid is included, the event will be ignored by every client except those who have the matching stick_id. If color is included, the stickman will be drawn in said color.
  !sb4 charX tileX - Erases stickman at said X, sent before !spos requests without a stickid
  !snew - Adds a new stickman to stick_xy and sends a client message, sent only when the script is run.
*/

// Controls
document.addEventListener("keyup", function(e) {
	switch (e.key) {
    case "ArrowLeft":
			if(stick_color !== 0x000000) {
			network.cmd(`!sb4${stick_xy[0]}X${stick_xy[2]}XC${stick_color}`);	// Erase previous stickman...
			stick_xy = coordinateAdd(...stick_xy,0,0,-1,0);
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}XC${stick_color}`); // ...and draw the next one
      } else { // if col isn't defined it'll be 0 anyway so no need to include it
			network.cmd(`!sb4${stick_xy[0]}X${stick_xy[2]}`);
			stick_xy = coordinateAdd(...stick_xy,0,0,-1,0);
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}`);
			}
			break;
    case "ArrowRight":
			if(stick_color !== 0x000000) {
			network.cmd(`!sb4${stick_xy[0]}X${stick_xy[2]}XC${stick_color}`);	// Erase previous stickman...
			stick_xy = coordinateAdd(...stick_xy,0,0,1,0);
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}XC${stick_color}`); // ...and draw the next one
      } else { // if col isn't defined it'll be 0 anyway so no need to include it
			network.cmd(`!sb4${stick_xy[0]}X${stick_xy[2]}`);
			stick_xy = coordinateAdd(...stick_xy,0,0,1,0);
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}`);
			}
		  break;
	};
});

// Functions
var regex = /^0x[0-9A-Fa-f]{6}$/;
function hexstr_to_num(str) {
	if(str.match(regex) === null) { // Prevent execution of bad code with regex
		return 0x000000;
	} else {
		return eval(str); // yes I know, eval sucks
	}
}

function stickman(pos,col){
if(!col) { col = 0x000000 } else { col = hexstr_to_num(col) };
loc = pos;
writeCharTo("O",col,...loc,true,true,null,false,false,false,false,true);// Head
loc = coordinateAdd(...loc,0,0,-1,1);
writeCharTo("/",col,...loc,true,true,null,false,false,false,false,true);// Left arm
loc = coordinateAdd(...loc,0,0,1,0);
writeCharTo("|",col,...loc,true,true,null,false,false,false,false,true);// Body
loc = coordinateAdd(...loc,0,0,1,0);
writeCharTo('\\',col,...loc,true,true,null,false,false,false,false,true);//Right arm
loc = coordinateAdd(...loc,0,0,-2,1);
writeCharTo("/",col,...loc,true,true,null,false,false,false,false,true);//Left leg
loc = coordinateAdd(...loc,0,0,2,0);
writeCharTo('\\',col,...loc,true,true,null,false,false,false,false,true);//Right leg
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

menu.addOption("Change Color",()=>{
stick_color = prompt("Pick a color for your stickman.\nMust be a hex value and begin with 0x, like this:\n0x00FF00 (example)");
network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}XC${stick_color}`);
});
w.on("cmd",e=>{
	switch (true) {
   case e.data.startsWith("!spos"):
		tx_cx = e.data.slice(5);
		tx_cx = tx_cx.split("X"); // Get tileX and charX (and stick_id if included) from the message
		draw_cx = Number(tx_cx[0]);
		draw_tx = Number(tx_cx[1]);
		draw_pos = [draw_cx,-1,draw_tx,5];
		if(tx_cx[2]) { // Includes stickman color
			if(tx_cx[2].startsWith("C")) { // 
				stickman(draw_pos,tx_cx[2].slice(1)); // remove C from value
			} else { // Is a targeted request
			if(tx_cx[2] == stick_id) { // Only the targeted client will process this request
				if(tx_cx[3]) { // Includes stickman color
				stickman(draw_pos,tx_cx[3].slice(1));
        } else {
				stickman(draw_pos);
				}
			}
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
			clientChatResponse("Stickman "+sender_stickid+" connected."); 
			if(stick_color !== 0x000000) {
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}X${sender_stickid}XC${stick_color}`); // Send stickman position so the new client can see everyone
      } else {
			network.cmd(`!spos${stick_xy[0]}X${stick_xy[2]}X${sender_stickid}`);
			}
		} else {
			clientChatResponse("Connected! Your ID: "+stick_id);
		}
  }
});

// Wait for tiles to load first
clientChatResponse("Connecting...")
setTimeout(()=>{
network.cmd(`!snew${stick_id}`);
},2000);
// w.on("cmd",e=>{console.table(e)}); // use for debugging
