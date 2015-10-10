document.onkeypress = function(e) {
    
    if (e.keyCode == 49) { // 1
        changeScene('scene_gencubes');
    } else if (e.keyCode == 50) { // 2
        changeScene('scene_tunnel');
    } else if (e.keyCode == 51) { // 3
        changeScene('scene_particle');
    }

    function changeScene(name) {
        window.location.href = "http://" + window.location.host + "/" + name + ".html"
    }
};