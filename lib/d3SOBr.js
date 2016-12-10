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

function decodePageParams(){
	var ano = 2010;
	var estadoUrl = getParameterByName('estado');
	var municipioUrl = getParameterByName('municipio');
	return ano, estado, municipio;
}

	function execBarrasOrgao(ano, estado, municipio) {
		var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"}
		d3sparql.debug = true;
		var endpoint = "http://cassidy.gpopai.usp.br:8209/"+endpoint[estado];
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
			var sparql = " \
			SELECT ?var_x (SUM(?valor) AS ?var_y) WHERE { \
  ?a a bra:Despesa ; \
     bra:valor ?valor . \
  ?a bra:temGestor ?b . \
  ?b dc:title ?var_x \
}GROUP BY ?var_x ORDER BY DESC(?var_y)"
			d3sparql.query(endpoint, sparql, renderBarrasOrga);
		}
		function renderBarrasOrga(json) {
			var config = {
				"width": 1000,
				"height": 800,
				"label_x": "Orgao",
        "label_y": "Gasto",
        "var_x": "var_x",
        "var_y": "var_y",
				"selector": "#graficoBarras"
			}
			d3sparql.barchart(json, config);
		}
