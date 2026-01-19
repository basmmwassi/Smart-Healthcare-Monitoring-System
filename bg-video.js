(() => {
  const videos = [
    "videos/bg1.mp4",
    "videos/bg2.mp4",
    "videos/bg3.mp4"
  ];

  const video = document.getElementById("bgVideo");
  if (!video) return; 

  let index = 0;

  function playCurrent() {
    video.src = videos[index];
    video.load();
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  video.addEventListener("ended", () => {
    index = (index + 1) % videos.length;
    playCurrent();
  });

  playCurrent();
})();
