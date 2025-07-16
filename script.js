const starContainer = document.getElementById("stars");
const starCount = 150;
const stars = [];

for (let i = 0; i < starCount; i++) {
  const star = document.createElement("div");
  star.className = "star";
  star.style.top = `${Math.random() * 100}vh`;
  star.style.left = `${Math.random() * 100}vw`;
  starContainer.appendChild(star);
  stars.push(star);
}

document.addEventListener("mousemove", (e) => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const moveX = (e.clientX - centerX) * 0.01;
  const moveY = (e.clientY - centerY) * 0.01;

  stars.forEach((star, i) => {
    const offsetX = (i % 5 - 2) * moveX;
    const offsetY = (i % 5 - 2) * moveY;
    star.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
});
