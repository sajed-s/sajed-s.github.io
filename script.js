const starContainer = document.getElementById("stars");
const starCount = 150;
const stars = [];

for (let i = 0; i < starCount; i++) {
  const star = document.createElement("div");
  star.className = "star";
  star.style.position = "absolute";
  star.style.width = "2px";
  star.style.height = "2px";
  star.style.borderRadius = "50%";
  star.style.background = "white";
  star.style.top = Math.random() * 100 + "vh";
  star.style.left = Math.random() * 100 + "vw";
  starContainer.appendChild(star);
  stars.push(star);
}

// Move stars with mouse
document.addEventListener("mousemove", (e) => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const moveX = (e.clientX - centerX) * 0.01;
  const moveY = (e.clientY - centerY) * 0.01;

  stars.forEach((star, i) => {
    const offsetX = (i % 10 - 5) * moveX;
    const offsetY = (i % 10 - 5) * moveY;
    star.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
});
