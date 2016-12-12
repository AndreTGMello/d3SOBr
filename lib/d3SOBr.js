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

    jsonTreemapzoom();
    setTimeout(function () {
      console.log(treemapzoomData);
//      var data = treemapzoomData;
      main({title: "Gastos Publicos"}, {key: "Despesas", values: treemapzoomData});
    }, 2000)
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
    "selector": "#tabelaDespesaCategoriaEconomicaDaDespesa"
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



function execBarrasOrgao(params) {
  var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"};
  var valor = {"SP":"Empenhado", "Federal":"", "municipio":"Pago"}
  d3sparql.debug = true;
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
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
  var sparql = prefix + " \
  SELECT ?var_x (SUM(?valor) AS ?var_y) WHERE { \
    ?a a bra:Despesa ; \
    bra:valor" + valor[params[1]] +" ?valor . \
    ?a bra:temGestor ?b . \
    ?b dc:title ?var_x \
  }GROUP BY ?var_x ORDER BY DESC(?var_y)"
  d3sparql.query(endpoint, sparql, renderBarrasOrgao);
}
function execTabelaCategoriaEconomicaDaDespesa(params) {
  var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"}
  var valor = {"SP":"Empenhado", "Federal":"", "municipio":"Pago"}
  d3sparql.debug = true;
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
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
  var sparql = prefix + " \
  SELECT (?tituloCategoriaEconomicaDaDespesa AS ?CategoriaEconomicaDaDespesa) (SUM(?valor) AS ?total) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temCategoriaEconomicaDaDespesa ?categoriaEconomicaDaDespesa . \
    ?categoriaEconomicaDaDespesa dc:title ?tituloCategoriaEconomicaDaDespesa \
  }GROUP BY ?tituloCategoriaEconomicaDaDespesa ORDER BY ?total"
  d3sparql.query(endpoint, sparql, renderTabelaCategoriaEconomicaDaDespesa);
}
function execTabelaGND(params) {
  var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"}
  var valor = {"SP":"Empenhado", "Federal":"", "municipio":"Pago"}
  d3sparql.debug = true;
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
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
  var sparql = prefix + " \
  SELECT (?tituloGND AS ?GrupoDaNaturezaDaDespesa) SUM(?valor) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temGND ?GND . \
    ?GND dc:title ?tituloGND \
  }GROUP BY ?tituloGND ORDER BY ?total"
  d3sparql.query(endpoint, sparql, renderTabelaGND);
}
function execTabelaModalidadeDeAplicacao(params) {
  var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"}
  var valor = {"SP":"Empenhado", "Federal":"", "municipio":"Pago"}
  d3sparql.debug = true;
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
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
  var sparql = prefix + " \
  SELECT (?tituloModalidadeDeAplicacao AS ?ModalidadeDeAplicacao) SUM(?valor) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temModalidadeDeAplicacao ?modalidadeDeAplicacao . \
    ?modalidadeDeAplicacao dc:title ?tituloModalidadeDeAplicacao \
  }GROUP BY ?tituloModalidadeDeAplicacao"
  d3sparql.query(endpoint, sparql, renderTabelaModalidadeDeAplicacao);
}
function execTabelaElementoDeDespesa(params) {
  var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"}
  var valor = {"SP":"Empenhado", "Federal":"", "municipio":"Pago"}
  d3sparql.debug = true;
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
  PREFIX bra: <http://www.semanticweb.org/ontologies/OrcamentoPublicoBrasileiro.owl/>"
  var sparql = prefix + " \
  SELECT (?tituloElementoDeDespesa AS ?ElementoDeDespesa) SUM(?valor) WHERE { \
    ?despesa a bra:Despesa .  \
    ?despesa bra:valor" + valor[params[1]] +" ?valor . \
    ?despesa bra:temElementoDeDespesa ?elementoDeDespesa . \
    ?elementoDeDespesa dc:title ?tituloElementoDeDespesa \
  }GROUP BY ?tituloElementoDeDespesa"
  d3sparql.query(endpoint, sparql, renderTabelaElementoDeDespesa);
}

var listaBalde = new Array();
var treemapzoomData = new Array();

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

var treemapzoomDataJson;
function jsonTreemapzoom(){
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
    d3sparql.query(endpoint, sparql, function(json){ treemapzoomDataJson = json });
}

function storeReceitaTreemapzoomData(json){
	var tamanho = json.results.bindings.length;
  console.log(tamanho);
  var results = json.results.bindings;
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
      console.log(treemapzoomData);
      treemapzoomData.push(objectFirst);
      treemapzoomData[aux].values = new Array();
      treemapzoomData[aux].values.push(objectSecond);
      treemapzoomData[aux].values[auxDois].values = new Array();
      treemapzoomData[aux].values[auxDois].values.push(objectFourth);

  treemapzoomData.pop();
    }else {
      console.log("Primeiro");
      aux = 0;
      for (var j = 0; j < treemapzoomData.length; j++) {
        console.log("Inicio teste primeiro");
        if (typeof treemapzoomData[j] === 'undefined') {
          console.log("Nao definido primeiro");
          existe = false;
          break;
        }
        if (treemapzoomData[j].key == valueFirst) {
          console.log("Ja existe primeiro");
          existe = true;
          break;
        }
        aux++;
      }
      if (!existe) {
      console.log("Nao existe primeiro");
        treemapzoomData.push(objectFirst);
        //aux++;
      }
      console.log(aux);
console.log("Segundo");
      auxDois = 0;
      if (typeof treemapzoomData[aux].values === 'undefined') {
        console.log("Nao definido segundo");
          treemapzoomData[aux].values = new Array();
      }
      for (var j = 0; j < treemapzoomData[aux].values.length; j++) {
      console.log("Inicio teste segundo");
      console.log(valueSecond);
      console.log(treemapzoomData[aux].values[j].key)
        if (typeof treemapzoomData[aux].values[j].key === 'undefined') {
        console.log("Nao definido segundo");
          existeDois = false;
          treemapzoomData[aux].values = new Array();
          break;
        }
        else if (treemapzoomData[aux].values[j].key == valueSecond) {
          console.log("Existe segundo");
          existeDois = true;
          break;
        }
        auxDois++;
      }
      if (!existeDois) {
      console.log("Nao existe segundo");
        treemapzoomData[aux].values.push(objectSecond);

      }
      console.log("Terceiro");
      console.log(auxDois);
      if (typeof treemapzoomData[aux].values[auxDois].values === 'undefined' ){
      console.log("Terceiro undefined");
      console.log(auxDois);
      treemapzoomData[aux].values[auxDois].values = new Array();
      };
      treemapzoomData[aux].values[auxDois].values.push(objectFourth);
	console.log(treemapzoomData);
    }
    i++;
  }
  console.log("imprimindo balde no retorna");
  console.log(treemapzoomData);
}

function printLog(print){
  console.log("Imprimindo:");
  console.log(print);
}


  window.addEventListener('message', function(e) {
    var opts = e.data.opts,
    data = e.data.data;

    return main(opts, data);
  });

  var defaults = {
    margin: {top: 24, right: 0, bottom: 0, left: 0},
    rootname: "TOP",
    format: ",d",
    title: "",
    width: 960,
    height: 500
  };

  function main(o, data) {
    var root,
    opts = $.extend(true, {}, defaults, o),
    formatNumber = d3.format(opts.format),
    rname = opts.rootname,
    margin = opts.margin,
    theight = 36 + 16;

    $('#treemapzoomReceita').width(opts.width).height(opts.height);
    var width = opts.width - margin.left - margin.right,
    height = opts.height - margin.top - margin.bottom - theight,
    transitioning;

    var color = d3.scale.category20c();

    var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

    var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height]);

    var treemap = d3.layout.treemap()
    .children(function(d, depth) { return depth ? null : d._children; })
    .sort(function(a, b) { return a.value - b.value; })
    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
    .round(false);

    var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .style("margin-left", -margin.left + "px")
    .style("margin.right", -margin.right + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("shape-rendering", "crispEdges");

    var grandparent = svg.append("g")
    .attr("class", "grandparent");

    grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top);

    grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

    if (opts.title) {
      $("#chart").prepend("<p class='title'>" + opts.title + "</p>");
    }
    if (data instanceof Array) {
      root = { key: rname, values: data };
    } else {
      root = data;
    }

    initialize(root);
    accumulate(root);
    layout(root);
    console.log(root);
    display(root);

    if (window.parent !== window) {
      var myheight = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage({height: myheight}, '*');
    }

    function initialize(root) {
      root.x = root.y = 0;
      root.dx = width;
      root.dy = height;
      root.depth = 0;
    }

    // Aggregate the values for internal nodes. This is normally done by the
    // treemap layout, but not here because of our custom implementation.
    // We also take a snapshot of the original children (_children) to avoid
    // the children being overwritten when when layout is computed.
    function accumulate(d) {
      return (d._children = d.values)
      ? d.value = d.values.reduce(function(p, v) { return p + accumulate(v); }, 0)
      : d.value;
    }

    // Compute the treemap layout recursively such that each group of siblings
    // uses the same size (1×1) rather than the dimensions of the parent cell.
    // This optimizes the layout for the current zoom state. Note that a wrapper
    // object is created for the parent node for each group of siblings so that
    // the parent’s dimensions are not discarded as we recurse. Since each group
    // of sibling was laid out in 1×1, we must rescale to fit using absolute
    // coordinates. This lets us use a viewport to zoom.
    function layout(d) {
      if (d._children) {
        treemap.nodes({_children: d._children});
        d._children.forEach(function(c) {
          c.x = d.x + c.x * d.dx;
          c.y = d.y + c.y * d.dy;
          c.dx *= d.dx;
          c.dy *= d.dy;
          c.parent = d;
          layout(c);
        });
      }
    }

    function display(d) {
      grandparent
      .datum(d.parent)
      .on("click", transition)
      .select("text")
      .text(name(d));

      var g1 = svg.insert("g", ".grandparent")
      .datum(d)
      .attr("class", "depth");

      var g = g1.selectAll("g")
      .data(d._children)
      .enter().append("g");

      g.filter(function(d) { return d._children; })
      .classed("children", true)
      .on("click", transition);

      var children = g.selectAll(".child")
      .data(function(d) { return d._children || [d]; })
      .enter().append("g");

      children.append("rect")
      .attr("class", "child")
      .call(rect)
      .append("title")
      .text(function(d) { return d.key + " (" + formatNumber(d.value) + ")"; });
      children.append("text")
      .attr("class", "ctext")
      .text(function(d) { return d.key; })
      .call(text2);

      g.append("rect")
      .attr("class", "parent")
      .call(rect);

      var t = g.append("text")
      .attr("class", "ptext")
      .attr("dy", ".75em")

      t.append("tspan")
      .text(function(d) { return d.key; });
      t.append("tspan")
      .attr("dy", "1.0em")
      .text(function(d) { return formatNumber(d.value); });
      t.call(text);

      g.selectAll("rect")
      .style("fill", function(d) { return color(d.key); });

      function transition(d) {
        if (transitioning || !d) return;
        transitioning = true;

        var g2 = display(d),
        t1 = g1.transition().duration(750),
        t2 = g2.transition().duration(750);

        // Update the domain only after entering new elements.
        x.domain([d.x, d.x + d.dx]);
        y.domain([d.y, d.y + d.dy]);

        // Enable anti-aliasing during the transition.
        svg.style("shape-rendering", null);

        // Draw child nodes on top of parent nodes.
        svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

        // Fade-in entering text.
        g2.selectAll("text").style("fill-opacity", 0);

        // Transition to the new view.
        t1.selectAll(".ptext").call(text).style("fill-opacity", 0);
        t1.selectAll(".ctext").call(text2).style("fill-opacity", 0);
        t2.selectAll(".ptext").call(text).style("fill-opacity", 1);
        t2.selectAll(".ctext").call(text2).style("fill-opacity", 1);
        t1.selectAll("rect").call(rect);
        t2.selectAll("rect").call(rect);

        // Remove the old node when the transition is finished.
        t1.remove().each("end", function() {
          svg.style("shape-rendering", "crispEdges");
          transitioning = false;
        });
      }

      return g;
    }

    function text(text) {
      text.selectAll("tspan")
      .attr("x", function(d) { return x(d.x) + 6; })
      text.attr("x", function(d) { return x(d.x) + 6; })
      .attr("y", function(d) { return y(d.y) + 6; })
      .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
    }

    function text2(text) {
      text.attr("x", function(d) { return x(d.x + d.dx) - this.getComputedTextLength() - 6; })
      .attr("y", function(d) { return y(d.y + d.dy) - 6; })
      .style("opacity", function(d) { return this.getComputedTextLength() < x(d.x + d.dx) - x(d.x) ? 1 : 0; });
    }

    function rect(rect) {
      rect.attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
      .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
    }

    function name(d) {
      return d.parent
      ? name(d.parent) + " / " + d.key + " (" + formatNumber(d.value) + ")"
      : d.key + " (" + formatNumber(d.value) + ")";
    }
  }

  if (window.location.hash === "") {
    jsonTreemapzoom();
    setTimeout(function () {
      console.log(treemapzoomData);
//      var data = treemapzoomData;
      main({title: "Gastos Publicos"}, {key: "Despesas", values: treemapzoomData});
    }, 2000);

    /*    d3.json("countries.json", function(err, res) {
    if (!err) {
    console.log(res);
    var data = d3.nest().key(function(d) { return d.region; }).key(function(d) { return d.subregion; }).entries(res);
    main({title: "World Population"}, {key: "World", values: data});
  }
}); */
  }
