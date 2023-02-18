/**
 * This module stands for language translation tools.
 */
var languages = {
    fr: {
        about: "A Propos",
        chess: "Jeu d'Echec",
        latex: "Latex",
        welcome: "Soyez les bienvenus sur mon site !"
    },
    eng: {
        about: "About",
        chess: "Chess Game",
        latex: "Latex",
        welcome: "Welcome to my website !"
    }
};
function getTranslatableElements() {
    /**
     * This function is used to take all the "translate"
     * class element and change their language
     * @return a list of all the elements.
     */
    return document.querySelectorAll(".translate");
}
function translateAll() {
    /**
     * Translate the elements in page in the language selected.
     */
    var select = document.getElementById("language");
    if (select == null) {
        return;
    }
    var language = select.options[select.selectedIndex].text;
    getTranslatableElements().forEach(function (element) {
        var id = element.getAttribute("id");
        if (id !== undefined) {
            element.setAttribute("text", languages["".concat(language)][id]);
        }
    });
}
