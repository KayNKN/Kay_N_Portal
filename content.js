/* I edit my site text, media, and download links here. I keep multiline text between backticks. */

window.KN = {

  name: "Kay_N",
  tagline: "[Welcome_ANON]",

  /* I change my header artwork here. */
  artwork: {
    tabIcon: "Tab_Logo.png?v=20260919",
    mainImage: "art/Main_Logo.png",
    mainVideo: "art/IntroWithoutS.mp4" // I leave this empty to use mainImage.
  },

  /* I set my contact and social links here. Empty links stay hidden. */
  discord: "https://discord.gg/6xuBCrgGdp",

  twitter: "https://x.com/Kay_NKN",
  mail: "k4y.nkn@gmail.com",
  steam: "",

  /* I choose the game shown when the homepage opens. */
  project: {
    name: "A_Way_Out",
    pitch: "[Keep_the_Camera_ON.]",

    media: [
      "art/A_Way_Out/A_Way_Out_GIF.gif",
      "art/A_Way_Out/A_Way_Out_Img_1.png",
      "art/A_Way_Out/A_Way_Out_Img_2.png",
      "art/A_Way_Out/A_Way_Out_Img_3.png",
      "https://youtu.be/416h8jhay9w"

    ]
  },

  /* I add my soundtrack models and audio files here. */
  music: [
    {
      game: "A_Way_Out",
      title: "A_Way_Out OST",
      model: "art/models/A_Way_Out_OST.glb",
      /* I name each track and add its audio file here. */
      tracks: [
        { title: "Out Of Place", audio: "audio/A_WAY_OUT_OSTs/Out_Of_Place.mp3", duration: 42.888 },
        { title: "Where We Go", audio: "audio/A_WAY_OUT_OSTs/Where_We_Go.mp3", duration: 44.64 }
      ]
    },
    {
      game: "DEAD_BAND",
      title: "DEAD_BAND OST",
      model: "art/models/DEAD_BAND_OST.glb",
      tracks: [
        { title: "In The Wind", audio: "audio/DEAD_BAND_OSTs/IN_THE_WIND.mp3", duration: 100.056 }
      ]
    }
  ],

  /* I add new logs at the top. Media accepts local paths or video links. */
  logs: [

    {
      date: "2026-09-19",
      tag: "release",
      title: "[ Game Release : DEAD_BAND ]",
      url: "",
      desc: `Hello Anon,

_DEAD_BAND is out today for Windows and Linux. Someone has to work around here.

_Head to the game archive on the homepage, select DEAD_BAND, and choose your download. You can find the controls under About this game / controls.

_I have also added the soundtrack to the music archive. Select the DEAD_BAND disc to listen to In The Wind.

_Thank you for playing. I would love to hear what you think in the Discord server. See you around.`
    },

    {
      date: "2026-09-16",
      tag: "misc",
      title: "[ Website Update : A New Look ]",
      url: "",
      desc: `Hello Anon,

_I have given the website a fresh look, with cleaner layouts, easier-to-read text, and spinning 3D models in the game archive.

_I have also added a music archive with custom 3D discs and a player for the A_Way_Out and DEAD_BAND soundtracks. Pick a disc and have a listen while you look around.

_I will keep adding new games, music, and updates here. See you around.`
    },

    {
      date: "2026-09-14",
      tag: "devlog",
      title: "[ New Game Entry : DEAD_BAND ]",
      url: "",
      desc:`Hello Anon,
[_After the release of A_WAY_OUT (my first game), I went through a massive creative block. I have been coming up with game ideas to set the tone for the kind of world, lore, and experiences I would like to create and share with you all.]

WHAT I WORKED ON
[_Before DEAD_BAND, I had dabbled with Godot and made a few projects that I might get back to in the future. However, DEAD_BAND was not made in it. I went back to Unity for some reason I cannot remember. With that being said, I might give Godot another attempt to see if it can handle my vision for how the game should look, feel, and play (and the technical stuff I do not want to bore you with, haha). I have also started getting more comfortable with Blender and developing an art style for my textures. I am looking forward to improving that style and creating more distinctive visuals for my games going forward.]

WHAT I LEARNED
[_Unity likes compiling every minor change I make in the code, and it is such a pain in the ass. In my experience, Godot handles that sort of stuff much better for now. If I do switch to Godot, improvements to compilation in Unity might bring me back.]

WHAT IS NEXT
[_More cool stuff to release! I am looking forward to seeing you play and have a blast, or maybe not (the next game is a bit of a rage/brain game, not going to lie). Make sure to follow my socials to stay up to date with the latest projects and news. There is a Discord server where you can chat with me and other players, and a Twitter account where I post behind-the-scenes things. Until then, see you around.]`,
      media: [
        "art/DEAD_BAND/DEAD_BAND_GIF.gif",
        "art/DEAD_BAND/DEAD_BAND_Img_1.png",
        "art/DEAD_BAND/DEAD_BAND_Img_2.png",
        "art/DEAD_BAND/DEAD_BAND_Img_3.png",
        "https://youtu.be/P7-rDTA0c1A"
      ]
    },

    { date: "2026-08-02", tag: "devlog", title: "[ New Game Entry : A_Way_Out ]", url: "",

      desc: "[_A look into a horror experience I have been working on for a while now.\n_Keep an eye on it, Anon.]",

      media: [
      "art/A_Way_Out/A_Way_Out_GIF.gif",
      "art/A_Way_Out/A_Way_Out_Img_1.png",
      "art/A_Way_Out/A_Way_Out_Img_2.png",
      "art/A_Way_Out/A_Way_Out_Img_3.png",
      "https://youtu.be/416h8jhay9w"
            ]
    },
    {
      date: "2026-08-08",
      tag: "release",
      title: "[ Game Release : A_Way_Out ]",
      url: "",
      desc: `Hello Anon,

_A_Way_Out is now available for Windows and Linux. It is an experimental horror experience where a camera is your only way to see.

_Head to the game archive on the homepage, select A_Way_Out, and choose your download. The controls are listed under About this game / controls.

_Thank you for playing my first game. See you around.`
    },
    {
        date: "2026-08-01", tag: "misc", title: "[The Portal has been established.]",
        desc: "[_The portal is open, Anon. Have fun.]"
    }

  ],

  /* I choose how many empty game slots to show. */
  Protocols: {
    emptySlots: 1,
    emptyYear: "SOON",
    emptyTitle: "???",
    emptyNote: "the next one goes here"
  },

  /* I add games here. I keep each model, gallery, controls, and downloads together. */
  games: [
    {
      title: "[A_Way_Out]",

      model: "art/models/A_Way_Out.glb",
      modelRotation: "33deg",
      year: "2026",
      version: "V_1.0",
      platforms: "[Windows // 108 MB]\n[Linux // 108 MB]",

      released: true,
      releaseDate: "2026-08-08", /* I use YYYY-MM-DD; my newest dated release appears first. */
      lockedLabel: "⊘ build sealed",
      lockedNote: "no build has been released yet.",

      desc: "",
      pitch:`//_Developed by: Kay_N

_An experimental horror experience where you navigate around with a camera as your only way to see.

_GOOD TO KNOW: The camera can only recharge when it is turned off.

//Controls//
[W][A][S][D] - Movement
[Mouse] - Look around
[Shift] - Sprint
[Mouse wheel] - Zoom`,

      media: [
        "art/A_Way_Out/A_Way_Out_GIF.gif",
        "art/A_Way_Out/A_Way_Out_Img_1.png",
        "art/A_Way_Out/A_Way_Out_Img_2.png",
        "art/A_Way_Out/A_Way_Out_Img_3.png",

      ],

      downloads: [
        { os: "Windows", file: "https://www.dropbox.com/scl/fi/nyxnr8ql6u7ij4jgervaw/A_WAY_OUT.zip?rlkey=tpknh9a0k44ce7mpuilpxujoc&st=hvq1c44k&dl=1"  },
        { os: "Linux",   file: "https://www.dropbox.com/scl/fi/eic5azo6f9ly57zorah8c/A_WAY_OUT.zip?rlkey=obbygwj4rd6ryxtyovdf5icis&st=8skfz7it&dl=1" }
      ],

    }
    ,
    {
      title: "[DEAD_BAND]",
      model: "art/models/DEAD_BAND.glb",
      modelRotation: "33deg",
      released: true,
      releaseDate: "2026-09-19",
      desc: "",
      // I edit my description and controls below.
      pitch:`//_Developed by: Kay_N

_Someone has to work around here.

//Controls//
[W][A][S][D] - [Movement]
[F / Left mouse button] - [Interact]`,
      version: "V_1.0",
      platforms: "[Windows // 63 MB]\n[Linux // 60 MB]",
      media: [
      "art/DEAD_BAND/DEAD_BAND_GIF.gif",
      "art/DEAD_BAND/DEAD_BAND_Img_1.png",
      "art/DEAD_BAND/DEAD_BAND_Img_2.png",
      "art/DEAD_BAND/DEAD_BAND_Img_3.png",
      "https://youtu.be/P7-rDTA0c1A",
            ],
      downloads: [
        { os: "Windows", file: "https://www.dropbox.com/scl/fi/3jgxysdv98lvhxovdxuva/DEAD_BAND_Win.zip?rlkey=6u32kn329qb99rkc0kizni778&st=vyvf2w7t&dl=1" },
        { os: "Linux", file: "https://www.dropbox.com/scl/fi/lc4ajgytwzfx8izt564rl/DEAD_BAND_Linux.zip?rlkey=oi86dzj3qwiwdj1l0ze3m7wdg&st=scnay7xp&dl=1" }
      ]
    }

  ],

  /* I edit my About text here. */
  bio: [
    "[ Kay_N is a game developer. Always liked Technology and sci-fi, so why not mix both and see what comes out of it. Also produces music for the Games. See you around, Anon. ]",
  ]
};
