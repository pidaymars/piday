decks = document.getElementsByClassName("deck");
for (i = 0; i < decks.length; i++) {
    cards = decks[i].getElementsByClassName("card");
    for(j = 0; j < cards.length; j++) {
        cards[j].style.zIndex = j;
        cards[j].style.left = (2*j).toString() + "em";
        number = cards[j].innerHTML;
        cards[j].innerHTML += "<span class=\"number\">"+ number +"</span>";
        cards[j].innerHTML += "<span class=\"corner\">"+ number +"</span>";
    }
}

