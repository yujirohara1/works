

var a = '';
a = a + '  <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">  ';
a = a + '    <div class="carousel-indicators">  ';
a = a + '      <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>  ';
a = a + '      <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>  ';
a = a + '      <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>  ';
a = a + '    </div>  ';
a = a + '    <div class="carousel-inner">  ';
a = a + '      <div class="carousel-item active">  ';
a = a + '        <img src="../static/image/aaa.png" class="d-block w-100" alt="...">  ';
a = a + '      </div>  ';
a = a + '      <div class="carousel-item">  ';
a = a + '        <img src="../static/image/aaa.png" class="d-block w-100" alt="...">  ';
a = a + '      </div>  ';
a = a + '      <div class="carousel-item">  ';
a = a + '        <img src="../static/image/aaa.png" class="d-block w-100" alt="...">  ';
a = a + '      </div>  ';
a = a + '    </div>  ';
a = a + '    <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">  ';
a = a + '      <span class="carousel-control-prev-icon" aria-hidden="true"></span>  ';
a = a + '      <span class="visually-hidden">Previous</span>  ';
a = a + '    </button>  ';
a = a + '    <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">  ';
a = a + '      <span class="carousel-control-next-icon" aria-hidden="true"></span>  ';
a = a + '      <span class="visually-hidden">Next</span>  ';
a = a + '    </button>  ';
a = a + '  </div>' ;

var modalIntroduction = document.getElementById('modalIntroduction');
modalIntroduction.addEventListener('show.bs.modal', function (event) {
    var mainDiv = document.getElementById("modalBodyIntroduction");
    var tmpdiv = document.createElement(null);
    mainDiv.appendChild(tmpdiv);
    tmpdiv.outerHTML = a;

});
