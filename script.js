const background = document.querySelector(".background");

document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20; // -10 to 10
  const y = (e.clientY / window.innerHeight - 0.5) * 20;

  background.style.transform = `translate(${x}px, ${y}px)`;
});
