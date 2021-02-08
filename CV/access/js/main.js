window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    document.getElementById("home").style.backgroundColor = "rgba(0, 14, 34, 0.8)";
    document.getElementById("logo").style.color = "white";

    const links = document.querySelectorAll('.link')
    links.forEach(link => link.style.color = "white")
  } else {
    document.getElementById("home").style.backgroundColor = "white";
    document.getElementById("logo").style.color = "black";

    const links = document.querySelectorAll('.link')
    links.forEach(link => link.style.color = "black")
  }
}

ScrollReveal().reveal('.image', { scale: 0.85, delay: 500, reset: true });

ScrollReveal().reveal('.hero-text', {
  rotate: {
      x: 50,
      z: 50
  }, reset: true
});

ScrollReveal().reveal('.icons', { opacity: 0.5, reset: true, delay: 500 });

ScrollReveal().reveal('.project1', { origin: 'bottom',distance: '200px', reset: true  });
ScrollReveal().reveal('.project2', { origin: 'left',distance: '200px', reset: true  });
ScrollReveal().reveal('.project3', { origin: 'top',distance: '200px', reset: true  });
ScrollReveal().reveal('.project4', { origin: 'left',distance: '200px', reset: true  });

ScrollReveal().reveal('.project', { scale: 0.85, reset: true });