Lembra quando começamos a escrever a logica do algoritmo e havia pedido para criarmos um array com um array do progression.notes[]? Por que pedi isso? Temos um botão que se chama Regenerate Voice-Leading que quando clicamos nele e chama nosso voice-leading-algorithms para "refazer" o voice-leading. Vou dar um exemplo do que seria minha ideia original. Imagine que temos uma progressâo I - V - I em Dó, logo teriamos o seguinte array vindo do progression.notes[]
I V I 
C G C
E B E 
G D G
C G C
certo? Como queremos que notas comuns continuem na mesma voz, poderiamos ter as seguintes combinações:
I V I 
C G C (essa sempre sera assim por que como sabemos o baixo não se altera, o que vem é acatado)
E B E 
G G G
C D C
ou
I V I 
C G C (essa sempre sera assim por que como sabemos o baixo não se altera, o que vem é acatado)
G G G
E B E 
C D C
ou
I V I 
C G C (essa sempre sera assim por que como sabemos o baixo não se altera, o que vem é acatado)
E B C 
C D E
G G G
etc .... enfim rsrs acho que voce entendeu a ideia. Por fim o que disse foi o seguinte, se esse array de combinações chegar a 10, já podemos parar de calcular, por que podem haver muitas combinações depedendo do tamanho da progressão. Ai perguntamos, como escolher dentre um array valido? como ja garantimos que fizemos uma boa progressão garantindo o caminho comum, qualquer um dos arrays que criamos seria valido, poderiamos pegar qualquer um dos 10 randomicamente, assim quando clicassemos em Regenerate Voice_Leading, provavelmente mudariamos a condução de vozes. O que acha dessa ideia? Conseguiu entender com essa explicação?