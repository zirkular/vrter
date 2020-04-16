AFRAME.registerComponent('cursor-listener', {
    init: function () {
        this.onClick = this.onClick.bind(this);
    },
    play: function () {
        this.el.addEventListener('click', this.onClick);
    },
    pause: function () {
        this.el.removeEventListener('click', this.onClick);
    },
    onClick: function (evt) {
        // location.href='https://google.com'
        window.open(
            'https://vimeo.com/403330533',
            '_blank' // <- This is what makes it open in a new window.
        );
    }
  
    
  });