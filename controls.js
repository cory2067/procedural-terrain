function forceReload() {
    chunks = {};
    lastX = 0.5;
}


var seed = 0;
$(function() {
    $(document).keypress(function (e) {
        switch (e.which) {
            case 109: // m
                GENERATOR = 1 - GENERATOR;
                if (GENERATOR) {
                    $("#method").text("Perlin Noise");
                } else {
                    $("#method").text("Diamond-Square");
                }
                $("#perlin").toggle();
                $("#dsq").toggle();
                // fall through to reload
            case 114: //r
                forceReload();
                break;
            case 43: // +
                if (!GENERATOR) {
                    roughness += 0.1;
                    $("#roughness").text(Math.round(roughness*10) / 10);
                } else {
                    noise.seed(++seed);
                    $("#seed").text(seed);
                }
                forceReload();
                break;
            case 45: //-
                if (!GENERATOR) {
                    roughness -= 0.1;
                    $("#roughness").text(Math.round(roughness*10) / 10);
                } else {
                    noise.seed(--seed);
                    $("#seed").text(seed);
                }
                forceReload();
                break;
                
            default:
                console.log(e.which);
        }

        
    });



});
