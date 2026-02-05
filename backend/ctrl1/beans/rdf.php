<?php


// EasyRdf includes (relative path as per your setup)
require_once 'EasyRdf/Exception.php';
require_once 'EasyRdf/Utils.php';
require_once 'EasyRdf/RdfNamespace.php';
require_once 'EasyRdf/Literal.php';
require_once 'EasyRdf/Resource.php';
require_once 'EasyRdf/TypeMapper.php';
require_once 'EasyRdf/Graph.php';
require_once 'EasyRdf/Serialiser.php';
require_once 'EasyRdf/Serialiser/Turtle.php';
require_once 'EasyRdf/Format.php';

use EasyRdf\Graph;
use EasyRdf\RdfNamespace;

class RDFGenerator {
    public static function generate($sensor_name, $temperature, $humidity, $latitude, $longitude, $receiving_date, $sensor_meta) {
        // Set namespaces
        RdfNamespace::set('sosa', 'http://www.w3.org/ns/sosa/');
        RdfNamespace::set('ssn', 'http://www.w3.org/ns/ssn/');
        RdfNamespace::set('qudt', 'http://qudt.org/schema/qudt/');
        RdfNamespace::set('unit', 'http://qudt.org/vocab/unit/');
        RdfNamespace::set('xsd', 'http://www.w3.org/2001/XMLSchema#');
        RdfNamespace::set('geo', 'http://www.w3.org/2003/01/geo/wgs84_pos#');
        RdfNamespace::set('dcterms', 'http://purl.org/dc/terms/');
        RdfNamespace::set('sidf', 'http://example.org/ns/sidf#');
        RdfNamespace::set('iot', 'http://example.org/ns/iot#');

        $graph = new Graph();
        $time = time();

        // URIs
        $sensorUri = "urn:iot:sensor:$sensor_name";
        $foiUri = "urn:iot:location:$sensor_name";
        $tempObsUri = "urn:iot:obs:$sensor_name-temp-$time";
        $humidObsUri = "urn:iot:obs:$sensor_name-humid-$time";
        $deploymentUri = "urn:iot:deployment:$sensor_name";

        // Sensor node
        $graph->addResource($sensorUri, 'rdf:type', 'ssn:Sensor');
        $graph->addLiteral($sensorUri, 'dcterms:manufacturer', $sensor_meta['manufacturer']);
        $graph->addLiteral($sensorUri, 'ssn:hasOperatingProperty', $sensor_meta['calibration_status']);
        $graph->addLiteral($sensorUri, 'sidf:interfaceType', $sensor_meta['interface_type']);
        $graph->addLiteral($sensorUri, 'sidf:samplingRate', $sensor_meta['sampling_rate']);
        if (!empty($sensor_meta['data_format'])) $graph->addLiteral($sensorUri, 'sidf:dataFormat', $sensor_meta['data_format']);
        if (!empty($sensor_meta['voltage'])) $graph->addLiteral($sensorUri, 'sidf:voltage', (string)$sensor_meta['voltage'], null, 'xsd:decimal');
        if (!empty($sensor_meta['power'])) $graph->addLiteral($sensorUri, 'sidf:power', (string)$sensor_meta['power'], null, 'xsd:decimal');
        $graph->addResource($sensorUri, 'ssn:hasDeployment', $deploymentUri);
        $graph->addLiteral($sensorUri, 'rdfs:label', $sensor_meta['sensor_type']);

        // Deployment
        $graph->addResource($deploymentUri, 'rdf:type', 'ssn:Deployment');
        $graph->addLiteral($deploymentUri, 'rdfs:label', $sensor_meta['deployment']);
        $graph->addLiteral($deploymentUri, 'ssn:onPlatform', $sensor_meta['platform']);

        // Temperature range
        $tempRange = $graph->newBNode();
        $graph->addResource($sensorUri, 'ssn:hasMeasurementRange', $tempRange);
        $graph->addLiteral($tempRange, 'iot:minTemperature', (string)$sensor_meta['min_temperature'], null, 'xsd:decimal');
        $graph->addLiteral($tempRange, 'iot:maxTemperature', (string)$sensor_meta['max_temperature'], null, 'xsd:decimal');

        // Humidity range
        $humidRange = $graph->newBNode();
        $graph->addResource($sensorUri, 'ssn:hasMeasurementRange', $humidRange);
        $graph->addLiteral($humidRange, 'iot:minHumidity', (string)$sensor_meta['min_humidity'], null, 'xsd:decimal');
        $graph->addLiteral($humidRange, 'iot:maxHumidity', (string)$sensor_meta['max_humidity'], null, 'xsd:decimal');

        // Feature of interest (location)
        $graph->addResource($foiUri, 'rdf:type', 'sosa:FeatureOfInterest');
        $graph->addLiteral($foiUri, 'geo:lat', (string)$latitude, null, 'xsd:decimal');
        $graph->addLiteral($foiUri, 'geo:long', (string)$longitude, null, 'xsd:decimal');

        // Temperature Observation
        $graph->addResource($tempObsUri, 'rdf:type', 'sosa:Observation');
        $graph->addResource($tempObsUri, 'sosa:madeBySensor', $sensorUri);
        $graph->addResource($tempObsUri, 'sosa:observedProperty', 'iot:Temperature');
        $graph->addResource($tempObsUri, 'sosa:hasFeatureOfInterest', $foiUri);
        $graph->addLiteral($tempObsUri, 'sosa:resultTime', $receiving_date, null, 'xsd:dateTime');
        $tempResultUri = "$tempObsUri:result";
        $graph->addResource($tempObsUri, 'sosa:hasResult', $tempResultUri);
        $graph->addResource($tempResultUri, 'rdf:type', 'qudt:QuantityValue');
        $graph->addLiteral($tempResultUri, 'qudt:numericValue', (string)$temperature, null, 'xsd:decimal');
        $graph->addResource($tempResultUri, 'qudt:unit', 'unit:Kelvin');
        $graph->addResource($tempResultUri, 'qudt:quantityKind', 'qudt:ThermodynamicTemperature');
        $graph->addLiteral($tempObsUri, 'ssn:hasAccuracy', $sensor_meta['accuracy_temperature']);
        $graph->addLiteral($tempObsUri, 'ssn:hasResolution', (string)$sensor_meta['resolution_temperature'], null, 'xsd:decimal');

        // Humidity Observation
        $graph->addResource($humidObsUri, 'rdf:type', 'sosa:Observation');
        $graph->addResource($humidObsUri, 'sosa:madeBySensor', $sensorUri);
        $graph->addResource($humidObsUri, 'sosa:observedProperty', 'iot:Humidity');
        $graph->addResource($humidObsUri, 'sosa:hasFeatureOfInterest', $foiUri);
        $graph->addLiteral($humidObsUri, 'sosa:resultTime', $receiving_date, null, 'xsd:dateTime');
        $humidResultUri = "$humidObsUri:result";
        $graph->addResource($humidObsUri, 'sosa:hasResult', $humidResultUri);
        $graph->addResource($humidResultUri, 'rdf:type', 'qudt:QuantityValue');
        $graph->addLiteral($humidResultUri, 'qudt:numericValue', (string)$humidity, null, 'xsd:decimal');
        $graph->addResource($humidResultUri, 'qudt:unit', 'unit:Percent');
        $graph->addResource($humidResultUri, 'qudt:quantityKind', 'qudt:RelativeHumidity');
        $graph->addLiteral($humidObsUri, 'ssn:hasAccuracy', $sensor_meta['accuracy_humidity']);
        $graph->addLiteral($humidObsUri, 'ssn:hasResolution', (string)$sensor_meta['resolution_humidity'], null, 'xsd:decimal');

        // Serialize to Turtle format
        $rdf_metadata = $graph->serialise('turtle');

        // Save TTL file
        $timestamp = time();
        $ttl_filename = "rdf_exports/{$sensor_name}_$timestamp.ttl";
        if (!is_dir('rdf_exports')) mkdir('rdf_exports', 0777, true);
        file_put_contents($ttl_filename, $rdf_metadata);

        // Download URL (replace with your domain if needed)
        $download_url = "https://lostdevs.io/rdf_exports/{$sensor_name}_$timestamp.ttl";

        return [$rdf_metadata, $download_url];
    }
}
?>
