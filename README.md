# upGrade
Projeto de Extensão - Hackoonspace

## Conceito do projeto
Com o intuito de criar uma ferramenta que é utilizada pelos estudantes de faculdades ou cursos com matérias separadas em diversos períodos contendo dependências entre elas, esse projeto se propõe a apresentar uma interface gráfica, completamente dinâmica e customizável para que alunos dos mais diversos cursos possam organizar e planejar seu trajeto futuro independente de sua instituição de ensino. 

## Pré-requisitos e recursos utilizados
Esse projeto depende fortemente do [Cytoscape](https://cytoscape.org), utilizado para visualização e organização dos dados no projeto. Não é necessária nenhuma instalação do mesmo, já que ele é utilizado via o [script hospedado na cloudflare](https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.9.4/cytoscape.min.js). 

## Passo a passo
O projeto foi executado em algumas etapas breves:

1. Criação da estrutura básica web e estrutural, criando os arquivos `index.html` e `index.css`, além disso também definindo o padrão do arquivo `grades.jsonc`.
2. Criação da lógica inicial transferindo o objeto para um conjunto de _nodes_ dentro do _cytoscape_, contida no `index.js`
3. Desenvolvimento do algoritmo de caminho das dependências, buscando minimizar conflitos e melhorar visibilidade numa forma genérica.
4. Desenvolvimento da funcionalidade de visualização da "árvore de dependências" e alteração de perfis de matérias.

## Instalação / Execução
O projeto não necessita de nenhuma instalação prévia propriamente dita, as funcionalidades do projeto (como a leitura de arquivos JSON) e conexão requerem que os arquivos estejam hospedados em um "servidor".  

Portanto caso queira subir o projeto localmente, clone ou baixe o repositório e, estando dentro da pasta, esse ambiente como um servidor. Para fazer isso recomendo a utilização da [extensão Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) do [Visual Studio Code](https://code.visualstudio.com), mas qualquer outra alternativa de subir um servidor localmente para lidar com o CORS funciona.

Dentro do código, é carregado sempre a grade existente no arquivo `grades.jsonc`, caso queira alterar, basta alterar essa configuração no código e apontar para seu arquivo, ou substituir o arquivo com o seu próprio. O formato de uma grade deve ser respeitada para ser processada corretamente.

## Autores
* [Maurício Souza](https://github.com/mauriciocsz) 

## Imagens/screenshots
![image](https://github.com/mauriciocsz/upGrade/assets/59840433/f3f208d8-50f3-4e92-9524-3b46883a4fb5)
![image](https://github.com/mauriciocsz/upGrade/assets/59840433/e26fe454-03c3-4bfd-abcb-3ee6d9a26c00)
![image](https://github.com/mauriciocsz/upGrade/assets/59840433/acfbd769-0f15-439b-9520-423c1b98d4ad)
