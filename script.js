document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.body.style.backgroundPosition = `${50 + (x - 50) / 10}% ${50 + (y - 50) / 10}%`;
});
