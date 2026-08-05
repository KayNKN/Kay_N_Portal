/* ═══════════════════════════════════════════════════════════
   KN/OS - content.js
   The only file I touch to add content. Everything else is plumbing.

   ── MEDIA ─────────────────────────────────────────────────
   I drop files in art/ and write the filename:

     nothing:   media: ""
     one:       media: "art/shot.png"
     several:   media: ["art/shot1.png", "art/shot2.png", "art/clip.mp4"]
     labelled:  media: [{ src: "art/clip.mp4", caption: "first room" }]

   Images (png jpg gif webp), video (mp4 webm mov), audio
   (mp3 wav ogg m4a flac), and YouTube links all work. I never
   declare the type, the file extension settles it.
   Two or more items get clickable thumbnails under the main view.

   ── IF THE PAGE GOES BLANK ────────────────────────────────
   I broke the punctuation. Every /* needs a closing star-slash,
   every line ends with a comma, and text stays on ONE line inside
   its quotes. F12, Console tab, read the red line.
   ═══════════════════════════════════════════════════════════ */

window.KN = {

  name: "Kay_N",
  tagline: "[Welcome_SUBJECTS]",

  /* ── my links ──────────────────────────────────────────
     mail is DISPLAYED as plain text, never a clickable link. */
  discord: "https://discord.gg/6xuBCrgGdp",
  /* top-bar buttons. "" hides that button completely. */
  twitter: "https://x.com/Kay_NKN",
  youtube: "https://www.youtube.com/@K4y_N",
  mail: "k4y.nkn@gmail.com",
  itch: "https://kay-n.itch.io",
  steam: "",

  /* ── subject registry ──────────────────────────────────
     Keeps designations unique across every visitor. Both "" falls
     back to per-browser only.

     supabaseUrl : Project Settings > Data API > Project URL
     supabaseKey : Project Settings > API Keys > PUBLISHABLE key
                   (starts sb_publishable_, safe in a web page)
     Never the secret key. This file is public.                   */
  supabaseUrl: "https://ncmymwanlumssuuexhcy.supabase.co/rest/v1/",
  supabaseKey: "sb_publishable_MVqkk9pja2u9_qPNgf6dhw_KKPXxZ2P",

  steamSoon: true,          /* false + a URL in steam: makes it a real button */

  /* ── current project → HOME page ─────────────────────── */
  project: {
    name: "A_Way_Out",
    pitch: "[Keep_the_Camera_ON.]",
    
    media: [
      "art/A_Way_Out/A_Way_Out_GIF.gif",
      "art/A_Way_Out/A_Way_Out_Img_1.png",
      "art/A_Way_Out/A_Way_Out_Img_2.png",
      "art/A_Way_Out/A_Way_Out_Img_3.png",
      //"https://www.youtube.com/watch?v=OaemT0TlwIo"
    ]
  },








  



  /* ── transmission log → LOG page ───────────────────────
     newest at the top. tag: devlog | release | patch | misc
     url:  "" for no link.
     desc: the long write-up, shown under the entry on the LOG
           page. leave it out or "" for a headline-only entry.
           use \n for a new line, \n\n for a gap.
     media: "" for no picture. */
  logs: [

    { date: "2026-08-02", tag: "devlog", title: "[ Newest Protocol Entry : A_Way_Out ]", url: "",

      desc: "[A look into a horror experience i have been working on for a while now.\nkeep an eye on it SUBJECT.]",

      media: [
      "art/A_Way_Out/A_Way_Out_GIF.gif",
      "art/A_Way_Out/A_Way_Out_Img_1.png",
      "art/A_Way_Out/A_Way_Out_Img_2.png",
      "art/A_Way_Out/A_Way_Out_Img_3.png",
      //"https://www.youtube.com/watch?v=OaemT0TlwIo"
            ]
    }
    ,
    {
        date: "2026-08-01", tag: "misc", title: "[The Portal has been established.]",
        desc: "[A portal has been initiated for all SUBJECTS to use, Have fun.]" 
    }

  ],













  /* ── PROTOCOLS panel (home page) ───────────────────────
     One cartridge per game in the list below, then however many
     "coming soon" placeholders I want after them.

       emptySlots: 0   no placeholders at all
       emptySlots: 1   one (the default)
       emptySlots: 3   three                                     */
  Protocols: {
    emptySlots: 0,
    emptyYear: "SOON",
    emptyTitle: "empty slot",
    emptyNote: "the next one goes here"
  },

  /* ── released games → PROTOCOLS + GAMES page ───────────
     ADD a game     : copy a whole { ... } block, paste it below
                      the last one, comma between them.
     DELETE a game  : remove its { ... } block and its comma.
     The cartridge only shows year / title / desc / tags.        */
  games: [
    {
      title: "[A_Way_Out]",
      year: "2026",
      version: "V1.0",

      /* ▼ IS IT OUT YET? ────────────────────────────────
         false → dead "build sealed" button, itch.io shows
                 "coming soon", downloads ignored
         true  → real download button + itch.io link
         The two lines under it just change the wording.   */
      released: true,
      lockedLabel: "⊘ build sealed",
      lockedNote: "no build has been released to subjects yet.",

      desc: "[Keep_the_Camera_ON.]",
      pitch: "Developed by : Kay_N \n Tested by : The Subjects \n A horror Protocol experience where your navigate arround with a camera as your only form of visibility.",
      Platforms:"[ windows · /00 MB ] \n [ Linux · /00 MB ]",
      tags: ["Horror"],
      media: [
        "art/A_Way_Out/A_Way_Out_GIF.gif",
        "art/A_Way_Out/A_Way_Out_Img_1.png",
        "art/A_Way_Out/A_Way_Out_Img_2.png",
        "art/A_Way_Out/A_Way_Out_Img_3.png",
        //"https://www.youtube.com/watch?v=OaemT0TlwIo"
      ],
      /* one entry per platform - this becomes the download dropdown.
         put the files in downloads/ and match the names.
         I delete a line if I'm not shipping for that platform. */
      downloads: [
        { os: "windows", file: "downloads/Windows/A_Way_Out-win-v1.0", size: "180" },
        { os: "linux",   file: "downloads/A_Way_Out-linux-v1.0.tar.gz", size: "" }
      ],
      itch: "#"
    }
    /* copy the block above to add a game */
  ],

  /* ── lore ──────────────────────────────────────────────
     Ambient chatter that drifts down the margins of every page,
     and the rotating line in the workbench monitor. This is set
     dressing - write whatever fits the Protocol. Keep lines short
     so they don't crowd the page.

     Wrap a fragment in *stars* to make it red:
       "core temp *CRITICAL*"                                    */
  lore: [
    "PROTOCOL // node 07 online",
    "camera feed .... nominal",
    "subject count .. rising",
    "*do not turn it off*",
    "corridor 4 mapped 61%",
    "battery ........ 91%",
    "listening on 121.5",
    "last contact 04:12",
    "*something moved*",
    "tape 3 recovered",
    "lens condensation +2",
    "no exit logged today",
    "signal drift .. 0.4hz",
    "*keep the camera on*",
    "power cell ..... stable",
    "door 12 unresponsive",
    "archive write ... ok",
    "footsteps? .... unclear",
    "depth ......... 40m",
    "*it knows you're here*",
    "backup light out",
    "audio ch2 clipping",
    "map data corrupt",
    "who is walking above"
  ],

  /* ── about page ──────────────────────────────────────── */
  bio: [
    "[ Kay_N is a game developer. Always liked horror and sci-fi, so why not mix both and see what comes out of it. Also produces music for the Protocols [Games]. See you around, Subject.]",
    //"[ second paragraph if Needed. ]"
  ]
};