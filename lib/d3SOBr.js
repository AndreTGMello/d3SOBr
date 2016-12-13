function reloadWithQueryStringVars (queryStringVars) {
  var existingQueryVars = location.search ? location.search.substring(1).split("&") : [],
  currentUrl = location.search ? location.href.replace(location.search,"") : location.href,
  newQueryVars = {},
  newUrl = currentUrl + "?";
  if(existingQueryVars.length > 0) {
    for (var i = 0; i < existingQueryVars.length; i++) {
      var pair = existingQueryVars[i].split("=");
      newQueryVars[pair[0]] = pair[1];
    }
  }
  if(queryStringVars) {
    for (var queryStringVar in queryStringVars) {
      newQueryVars[queryStringVar] = queryStringVars[queryStringVar];
    }
  }
  if(newQueryVars) {
    for (var newQueryVar in newQueryVars) {
      newUrl += newQueryVar + "=" + newQueryVars[newQueryVar] + "&";
    }
    newUrl = newUrl.substring(0, newUrl.length-1);
    window.location.href = newUrl;
  } else {
    window.location.href = location.href;
  }
} //http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript

function setGetParameter(paramName, paramValue)
{
  var url = window.location.href;
  var hash = location.hash;
  url = url.replace(hash, '');
  if (url.indexOf(paramName + "=") >= 0)
  {
    var prefix = url.substring(0, url.indexOf(paramName));
    var suffix = url.substring(url.indexOf(paramName));
    suffix = suffix.substring(suffix.indexOf("=") + 1);
    suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
    url = prefix + paramName + "=" + paramValue + suffix;
  }
  else
  {
    if (url.indexOf("?") < 0)
    url += "?" + paramName + "=" + paramValue;
    else
    url += "&" + paramName + "=" + paramValue;
  }
  window.location.href = url + hash;
}

function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript

function getAllPageParams(){
  var ano = 2010;
  var origem = getParameterByName('origem');
  var municipio = getParameterByName('municipio');
  return [ano, origem, municipio];
}


function execAllViz(params) {
  var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"};
  var valor = {"SP":"Empenhado", "Federal":"", "municipio":"Pago"}
  var varx = "?var_x";
  d3sparql.debug = true;
  if(params[2] != "todos" && params[1] != "Federal"){
    params[1] = "municipio";
    varx = "'"+params[2]+"'";
  }

  var endpoint = "http://cassidy.gpopai.usp.br:8209/"+endpoint[params[1]];

  console.log(endpoint);

  var prefix = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
  PREFIX owl: <http://www.w3.org/2002/07/owl#> \
  PREFIX dc: <http://purl.org/dc/elements/1.1/> \
  PREFIX dcterms: <http://purl.org/dc/terms/> \
  PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
  PREFIX sim: <http://purl.org/ontology/similarity/> \
  PREFIX mo: <http://purl.org/ontology/mo/> \
  PREFIX ov: <http://open.vocab.org/terms/> \
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/> \
  PREFIX wgs84_pos: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
  PREFIX gn: <http://www.geonames.org/ontology#>"

  /*  var sparqlMapaSP = prefix + " \
  SELECT * WHERE { \
  ?sp gn:name 'São Paulo' . \
  ?sp wgs84_pos:lat ?lat . \
  ?sp wgs84_pos:long ?long . \
}LIMIT 1"
d3sparql.query("http://factforge.net/sparql", sparqlMapaSP, console.log(data);) */
if (params[1] == "municipio") {
  var sparqlBarrasOrgao = prefix + " \
  SELECT ?var_x (SUM(?valor) AS ?var_y) WHERE { \
    ?a a bra:Despesa ; \
    bra:valor" + valor[params[1]] +" ?valor ; \
    ?a bra:temGestor ?b . \
    ?b dc:title "+ varx +" \
  }GROUP BY ?var_x ORDER BY DESC(?var_y)"
  d3sparql.query(endpoint, sparqlBarrasOrgao, renderBarrasOrgao);

  var sparqlTabelaCategoriaEconomicaDaDespesa = prefix + " \
  SELECT (?tituloCategoriaEconomicaDaDespesa AS ?CategoriaEconomicaDaDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temCategoriaEconomicaDaDespesa ?categoriaEconomicaDaDespesa . \
    ?categoriaEconomicaDaDespesa dc:title ?tituloCategoriaEconomicaDaDespesa \
  }GROUP BY ?tituloCategoriaEconomicaDaDespesa ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaDespesa, renderTabelaCategoriaEconomicaDaDespesa);
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaDespesa, renderPizzaCategoriaEconomicaDaDespesa)

  var sparqlTabelaGND = prefix + " \
  SELECT (?tituloGND AS ?GrupoDaNaturezaDaDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?despesa bra:temGND ?GND . \
    ?GND dc:title ?tituloGND \
  }GROUP BY ?tituloGND ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaGND, renderTabelaGND);
  d3sparql.query(endpoint, sparqlTabelaGND, renderPizzaGND)

  var sparqlTabelaModalidadeAplicacao = prefix + " \
  SELECT (?tituloModalidadeDeAplicacao AS ?ModalidadeDeAplicacao) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?despesa bra:temModalidadeDeAplicacao ?modalidadeDeAplicacao . \
    ?modalidadeDeAplicacao dc:title ?tituloModalidadeDeAplicacao \
  }GROUP BY ?tituloModalidadeDeAplicacao ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaModalidadeAplicacao, renderTabelaModalidadeDeAplicacao);
  d3sparql.query(endpoint, sparqlTabelaModalidadeAplicacao, renderPizzaModalidadeAplicacao)

  var sparqlTabelaElementoDeDespesa = prefix + " \
  SELECT (?tituloElementoDeDespesa AS ?ElementoDeDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?despesa bra:temElementoDeDespesa ?elementoDeDespesa . \
    ?elementoDeDespesa dc:title ?tituloElementoDeDespesa \
  }GROUP BY ?tituloElementoDeDespesa ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaElementoDeDespesa, renderTabelaElementoDeDespesa);
  d3sparql.query(endpoint, sparqlTabelaElementoDeDespesa, renderPizzaElementoDeDespesa)

  var sparqlTabelaCategoriaEconomicaDaReceita = prefix +" \
  SELECT (?tituloCategoriaEconomicaDaReceita AS ?CategoriaEconomicaDaReceita) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?receita bra:temCategoriaEconomicaDaReceita ?categoriaEconomicaDaReceita . \
    ?categoriaEconomicaDaReceita dc:title ?tituloCategoriaEconomicaDaReceita \
  }GROUP BY ?tituloCategoriaEconomicaDaReceita ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaReceita, renderTabelaCategoriaEconomicaDaReceita);
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaReceita, renderPizzaCategoriaEconomicaDaReceita);

  var sparqlTabelaOrigem = prefix +" \
  SELECT (?tituloOrigem AS ?Origem) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?receita bra:temOrigem ?origem . \
    ?origem dc:title ?tituloOrigem \
  }GROUP BY ?tituloOrigem ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaOrigem, renderTabelaOrigem);
  d3sparql.query(endpoint, sparqlTabelaOrigem, renderPizzaOrigem);

  var sparqlTabelaEspecie = prefix +" \
  SELECT (?tituloEspecie AS ?Especie) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?receita bra:temEspecie ?especie . \
    ?especie dc:title ?tituloEspecie \
  }GROUP BY ?tituloEspecie ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaEspecie, renderTabelaEspecie);
  d3sparql.query(endpoint, sparqlTabelaEspecie, renderPizzaEspecie);

  var sparqlTabelaRubrica = prefix +" \
  SELECT (?tituloRubrica AS ?Rubrica) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?receita bra:temRubrica ?rubrica . \
    ?rubrica dc:title ?tituloRubrica \
  }GROUP BY ?tituloRubrica ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaRubrica, renderTabelaRubrica);
  d3sparql.query(endpoint, sparqlTabelaRubrica, renderPizzaRubrica);

  var sparqlTabelaAlinea = prefix +" \
  SELECT (?tituloAlinea AS ?Alinea) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?receita bra:temAlinea ?alinea . \
    ?alinea dc:title ?tituloAlinea \
  }GROUP BY ?tituloAlinea ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaAlinea, renderTabelaAlinea);

  var sparqlTabelaSubalinea = prefix +" \
  SELECT (?tituloSubalinea AS ?Subalinea) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temGestor ?g . \
    ?g dc:title "+varx+" .\
    ?receita bra:temSubalinea ?subalinea . \
    ?subalinea dc:title ?tituloSubalinea \
  }GROUP BY ?tituloSubalinea ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaSubalinea, renderTabelaSubalinea);
}else{
  var sparqlBarrasOrgao = prefix + " \
  SELECT ?var_x (SUM(?valor) AS ?var_y) WHERE { \
    ?a a bra:Despesa ; \
    bra:valor" + valor[params[1]] +" ?valor . \
    ?a bra:temGestor ?b . \
    ?b dc:title "+ varx +" \
  }GROUP BY ?var_x ORDER BY DESC(?var_y)"
  d3sparql.query(endpoint, sparqlBarrasOrgao, renderBarrasOrgao);

  var sparqlTabelaCategoriaEconomicaDaDespesa = prefix + " \
  SELECT (?tituloCategoriaEconomicaDaDespesa AS ?CategoriaEconomicaDaDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temCategoriaEconomicaDaDespesa ?categoriaEconomicaDaDespesa . \
    ?categoriaEconomicaDaDespesa dc:title ?tituloCategoriaEconomicaDaDespesa \
  }GROUP BY ?tituloCategoriaEconomicaDaDespesa ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaDespesa, renderTabelaCategoriaEconomicaDaDespesa);
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaDespesa, renderPizzaCategoriaEconomicaDaDespesa)

  var sparqlTabelaGND = prefix + " \
  SELECT (?tituloGND AS ?GrupoDaNaturezaDaDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temGND ?GND . \
    ?GND dc:title ?tituloGND \
  }GROUP BY ?tituloGND ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaGND, renderTabelaGND);
  d3sparql.query(endpoint, sparqlTabelaGND, renderPizzaGND)

  var sparqlTabelaModalidadeAplicacao = prefix + " \
  SELECT (?tituloModalidadeDeAplicacao AS ?ModalidadeDeAplicacao) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temModalidadeDeAplicacao ?modalidadeDeAplicacao . \
    ?modalidadeDeAplicacao dc:title ?tituloModalidadeDeAplicacao \
  }GROUP BY ?tituloModalidadeDeAplicacao ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaModalidadeAplicacao, renderTabelaModalidadeDeAplicacao);
  d3sparql.query(endpoint, sparqlTabelaModalidadeAplicacao, renderPizzaModalidadeAplicacao)

  var sparqlTabelaElementoDeDespesa = prefix + " \
  SELECT (?tituloElementoDeDespesa AS ?ElementoDeDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temElementoDeDespesa ?elementoDeDespesa . \
    ?elementoDeDespesa dc:title ?tituloElementoDeDespesa \
  }GROUP BY ?tituloElementoDeDespesa ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaElementoDeDespesa, renderTabelaElementoDeDespesa);
  d3sparql.query(endpoint, sparqlTabelaElementoDeDespesa, renderPizzaElementoDeDespesa)

  var sparqlTabelaCategoriaEconomicaDaReceita = prefix +" \
  SELECT (?tituloCategoriaEconomicaDaReceita AS ?CategoriaEconomicaDaReceita) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temCategoriaEconomicaDaReceita ?categoriaEconomicaDaReceita . \
    ?categoriaEconomicaDaReceita dc:title ?tituloCategoriaEconomicaDaReceita \
  }GROUP BY ?tituloCategoriaEconomicaDaReceita ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaReceita, renderTabelaCategoriaEconomicaDaReceita);
  d3sparql.query(endpoint, sparqlTabelaCategoriaEconomicaDaReceita, renderPizzaCategoriaEconomicaDaReceita);

  var sparqlTabelaOrigem = prefix +" \
  SELECT (?tituloOrigem AS ?Origem) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temOrigem ?origem . \
    ?origem dc:title ?tituloOrigem \
  }GROUP BY ?tituloOrigem ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaOrigem, renderTabelaOrigem);
  d3sparql.query(endpoint, sparqlTabelaOrigem, renderPizzaOrigem);

  var sparqlTabelaEspecie = prefix +" \
  SELECT (?tituloEspecie AS ?Especie) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temEspecie ?especie . \
    ?especie dc:title ?tituloEspecie \
  }GROUP BY ?tituloEspecie ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaEspecie, renderTabelaEspecie);
  d3sparql.query(endpoint, sparqlTabelaEspecie, renderPizzaEspecie);

  var sparqlTabelaRubrica = prefix +" \
  SELECT (?tituloRubrica AS ?Rubrica) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temRubrica ?rubrica . \
    ?rubrica dc:title ?tituloRubrica \
  }GROUP BY ?tituloRubrica ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaRubrica, renderTabelaRubrica);
  d3sparql.query(endpoint, sparqlTabelaRubrica, renderPizzaRubrica);

  var sparqlTabelaAlinea = prefix +" \
  SELECT (?tituloAlinea AS ?Alinea) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temAlinea ?alinea . \
    ?alinea dc:title ?tituloAlinea \
  }GROUP BY ?tituloAlinea ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaAlinea, renderTabelaAlinea);

  var sparqlTabelaSubalinea = prefix +" \
  SELECT (?tituloSubalinea AS ?Subalinea) (SUM(?valor) AS ?total) WHERE { \
    ?receita a bra:Receita .  \
    ?receita bra:valorArrecadado ?valor . \
    ?receita bra:temSubalinea ?subalinea . \
    ?subalinea dc:title ?tituloSubalinea \
  }GROUP BY ?tituloSubalinea ORDER BY DESC(?total)"
  d3sparql.query(endpoint, sparqlTabelaSubalinea, renderTabelaSubalinea);
}

}
function renderBarrasOrgao(json) {
  var config = {
    //"width": 1000,
    //"height": 800,
    "label_x": "Orgao",
    "label_y": "Gasto",
    "var_x": "var_x",
    "var_y": "var_y",
    "selector": "#graficoBarrasOrgao"
  }
  d3sparql.barchart(json, config);
}
function renderTabelaCategoriaEconomicaDaDespesa(json) {
  var config = {
    "width": 500,
    //"height": 800,
    "selector": "#tabelaCategoriaEconomicaDaDespesa"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaGND(json) {
  var config = {
    //"width": 1000,
    //"height": 800,
    "selector": "#tabelaGND"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaModalidadeDeAplicacao(json) {
  var config = {
    //"width": 1000,
    //"height": 800,
    "selector": "#tabelaModalidadeDeAplicacao"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaElementoDeDespesa(json) {
  var config = {
    //"width": 500,
    //"height": 800,
    "selector": "#tabelaElementoDeDespesa"
  }
  d3sparql.htmltable(json, config);
}
function renderPizzaCategoriaEconomicaDaDespesa(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaCategoriaEconomicaDaDespesa"
  }
  d3sparql.piechart(json, config)
}
function renderPizzaGND(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaGND"
  }
  d3sparql.piechart(json, config)
}
function renderPizzaModalidadeAplicacao(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaModalidadeDeAplicacao"
  }
  d3sparql.piechart(json, config)
}
function renderPizzaElementoDeDespesa(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaElementoDeDespesa"
  }
  d3sparql.piechart(json, config)
}
function renderTabelaCategoriaEconomicaDaReceita(json) {
  var config = {
    "width": 500,
    //"height": 800,
    "selector": "#tabelaCategoriaEconomicaDaReceita"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaOrigem(json) {
  var config = {
    //"width": 1000,
    //"height": 800,
    "selector": "#tabelaOrigem"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaEspecie(json) {
  var config = {
    //"width": 1000,
    //"height": 800,
    "selector": "#tabelaEspecie"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaRubrica(json) {
  var config = {
    //"width": 500,
    //"height": 800,
    "selector": "#tabelaRubrica"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaAlinea(json) {
  var config = {
    //"width": 500,
    //"height": 800,
    "selector": "#tabelaAlinea"
  }
  d3sparql.htmltable(json, config);
}
function renderTabelaSubalinea(json) {
  var config = {
    //"width": 500,
    //"height": 800,
    "selector": "#tabelaSubalinea"
  }
  d3sparql.htmltable(json, config);
}
function renderPizzaCategoriaEconomicaDaReceita(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaCategoriaEconomicaDaReceita"
  }
  d3sparql.piechart(json, config)
}
function renderPizzaOrigem(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaOriem"
  }
  d3sparql.piechart(json, config)
}
function renderPizzaEspecie(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaEspecie"
  }
  d3sparql.piechart(json, config)
}
function renderPizzaRubrica(json) {
  var config = {
    "width":  600,  // canvas width
    "height": 600,  // canvas height
    "margin":  10,  // canvas margin
    "hole":   0,  // doughnut hole: 0 for pie, r > 0 for doughnut
    "selector": "#pizzaRubrica"
  }
  d3sparql.piechart(json, config)
}

var listaBalde = new Array();

function pegaMunicipios(){
  var endpoint = "http://cassidy.gpopai.usp.br:8209/OrcamentoGovernoMunicipiosSP/query"
  var prefix = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
  PREFIX owl: <http://www.w3.org/2002/07/owl#> \
  PREFIX dc: <http://purl.org/dc/elements/1.1/> \
  PREFIX dcterms: <http://purl.org/dc/terms/> \
  PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
  PREFIX sim: <http://purl.org/ontology/similarity/> \
  PREFIX mo: <http://purl.org/ontology/mo/> \
  PREFIX ov: <http://open.vocab.org/terms/> \
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
  var sparql = prefix + " \
  SELECT ?nome \
  WHERE { \
    ?mun a bra:Municipio . \
    ?mun dc:title ?nome}"
    d3sparql.query(endpoint, sparql, retornaMunicipios);
    console.log("imprimindo balde no pegaMunicipio");
    console.log(listaBalde);
    return listaBalde;
  }

  function retornaMunicipios(json){
    console.log("entrei no retornaMunicipios finalizado")
    var tamanho = json.results.bindings.length;
    var i = 0;
    while(i < tamanho){
      listaBalde.push(json.results.bindings[i].nome.value);
      i = i + 1;
    }
    console.log("imprimindo balde no retorna");
    console.log(listaBalde);
  }

  var treemapzoomReceitaData = new Array();
  function jsonReceitaTreemapzoom(){
    var endpoint = "http://cassidy.gpopai.usp.br:8209/OrcamentoGovernoEstadoSP/query"
    var prefix = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
    PREFIX owl: <http://www.w3.org/2002/07/owl#> \
    PREFIX dc: <http://purl.org/dc/elements/1.1/> \
    PREFIX dcterms: <http://purl.org/dc/terms/> \
    PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
    PREFIX sim: <http://purl.org/ontology/similarity/> \
    PREFIX mo: <http://purl.org/ontology/mo/> \
    PREFIX ov: <http://open.vocab.org/terms/> \
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \
    PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
    var sparql = prefix + " \
    SELECT ?tituloCategoriaEconomicaDaReceita ?tituloOrigem ?tituloEspecie (SUM(?valor) AS ?total) WHERE { \
      ?receita a bra:Receita .  \
      ?receita bra:valorArrecadado ?valor . \
      ?receita bra:temCategoriaEconomicaDaReceita ?categoriaEconomicaDaReceita . \
      ?categoriaEconomicaDaReceita dc:title ?tituloCategoriaEconomicaDaReceita . \
      ?receita bra:temOrigem ?origem . \
      ?origem dc:title ?tituloOrigem . \
      ?receita bra:temEspecie ?especie . \
      ?especie dc:title ?tituloEspecie . \
    }GROUP BY ?tituloCategoriaEconomicaDaReceita ?tituloOrigem ?tituloEspecie ORDER BY ?tituloCategoriaEconomicaDaReceita ?tituloOrigem ?tituloEspecie DESC(?total)";
    console.log("chamada jQuery")
    d3sparql.query(endpoint, sparql, storeReceitaTreemapzoomData);
    printLog(treemapzoomReceitaData);
  }

  function storeReceitaTreemapzoomData(json){
    var tamanho = json.results.bindings.length;
    console.log(tamanho);
    var results = json.results.bindings;
    var valuesCountOrigem = -1;
    var valuesCountEspecie = -1;
    var i = 0;
    var aux = 0;
    var auxDois = 0;
    while(i < tamanho){
      console.log(i);
      var valueFirst = results[i].tituloCategoriaEconomicaDaReceita.value;
      var objectFirst = {};
      objectFirst.key = valueFirst;
      var valueSecond = results[i].tituloOrigem.value;
      var objectSecond = {};
      objectSecond.key = valueSecond;
      var valueThird = results[i].tituloEspecie.value;
      var valueFourth = results[i].total.value;
      var objectFourth ={};
      objectFourth.key = valueThird;
      objectFourth.value = valueFourth;

      var existe = false;
      var existeDois = false;
      console.log(valueFirst);
      console.log(valueSecond);
      console.log(valueThird);
      console.log(valueFourth);

      if(i==0){
        console.log(treemapzoomReceitaData);
        treemapzoomReceitaData.push(objectFirst);
        treemapzoomReceitaData[aux].values = new Array();
        treemapzoomReceitaData[aux].values.push(objectSecond);
        treemapzoomReceitaData[aux].values[auxDois].values = new Array();
        treemapzoomReceitaData[aux].values[auxDois].values.push(objectFourth);
      }else {
        console.log("Primeiro");
        aux = 0;
        for (var j = 0; j < treemapzoomReceitaData.length; j++) {
          console.log("Inicio teste primeiro");
          if (typeof treemapzoomReceitaData[j] === 'undefined') {
            console.log("Nao definido primeiro");
            existe = false;
            break;
          }
          if (treemapzoomReceitaData[j].key == valueFirst) {
            console.log("Ja existe primeiro");
            existe = true;
            break;
          }
          aux++;
        }
        if (!existe) {
          console.log("Nao existe primeiro");
          treemapzoomReceitaData.push(objectFirst);
          //aux++;
        }
        console.log(aux);
        console.log("Segundo");
        auxDois = 0;
        if (typeof treemapzoomReceitaData[aux].values === 'undefined') {
          console.log("Nao definido segundo");
          treemapzoomReceitaData[aux].values = new Array();
        }
        for (var j = 0; j < treemapzoomReceitaData[aux].values.length; j++) {
          console.log("Inicio teste segundo");
          console.log(valueSecond);
          console.log(treemapzoomReceitaData[aux].values[j].key)
          if (typeof treemapzoomReceitaData[aux].values[j].key === 'undefined') {
            console.log("Nao definido segundo");
            existeDois = false;
            treemapzoomReceitaData[aux].values = new Array();
            break;
          }
          else if (treemapzoomReceitaData[aux].values[j].key == valueSecond) {
            console.log("Existe segundo");
            existeDois = true;
            break;
          }
          auxDois++;
        }
        if (!existeDois) {
          console.log("Nao existe segundo");
          treemapzoomReceitaData[aux].values.push(objectSecond);

        }
        console.log("Terceiro");
        console.log(auxDois);
        if (typeof treemapzoomReceitaData[aux].values[auxDois].values === 'undefined' ){
          console.log("Terceiro undefined");
          console.log(auxDois);
          treemapzoomReceitaData[aux].values[auxDois].values = new Array();
        };
        treemapzoomReceitaData[aux].values[auxDois].values.push(objectFourth);
        console.log(treemapzoomReceitaData);
      }
      i++;
    }
    console.log("imprimindo balde no retorna");
    console.log(treemapzoomReceitaData);

  }

  function printLog(print){
    console.log("Imprimindo:");
    console.log(print);
  }
