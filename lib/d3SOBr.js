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
}

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

function getAllPageParams(){
	var ano = 2010;
	var estado = getParameterByName('estado');
	var municipio = getParameterByName('municipio');
	return [ano, estado, municipio];
}

	function execBarrasOrgao(params) {
		var endpoint = {"SP":"OrcamentoGovernoEstadoSP/query", "Federal":"OrcamentoGovernoFederal/query", "municipio":"OrcamentoGovernoMunicipiosSP/query"}
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
     bra:valor ?valor . \
  ?a bra:temGestor ?b . \
  ?b dc:title ?var_x \
}GROUP BY ?var_x ORDER BY DESC(?var_y)"
			d3sparql.query(endpoint, sparql, renderBarrasOrgao);
		}
		function renderBarrasOrgao(json) {
			var config = {
				"width": 1000,
				"height": 800,
				"label_x": "Orgao",
        "label_y": "Gasto",
        "var_x": "var_y",
        "var_y": "var_x",
				"selector": "#graficoBarras"
			}
			d3sparql.barchart(json, config);
		}
