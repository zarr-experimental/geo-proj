# Geospatial Projection Attribute Extension for Zarr

- **UUID**: f17cb550-5864-4468-aeb7-f3180cfb622f
- **Name**: geo:proj
- **Schema**: "https://raw.githubusercontent.com/zarr-experimental/geo-proj/refs/tags/v0.1.0/schema.json"
- **Extension Maturity Classification**: Proposal
- **Owner**: @emmanuelmathot, @maxrjones
- **Version** 0.1.0


## Description

This specification defines a JSON object that encodes datum and coordinate reference system (CRS) information for geospatial data. Additionally, this specification defines a convention for storing this object under the `proj` key within the `geo` dictionary in the attributes of Zarr groups or arrays.

- Examples:
    - [gdal-test-case](examples/zarr_convention_metadata.json)

## Motivation

- Provides simple, standardized CRS encoding without complex nested structures
- Compatible with existing geospatial tools (GDAL, rasterio, pyproj)
- Based on the proven STAC Projection Extension model

## Inheritance Model

The `geo:proj` convention object follows a simple group-to-array inheritance model that should be understood first:

### Inheritance Rules

1. **Group-level definition** (recommended): When `geo:proj` convention is defined at the group level, it applies to all arrays that are direct children of that group. It does not apply to groups or arrays deeper in the hierarchy (e.g., grandchildren).
2. **Array-level override**: An array can completely override the group's `geo:proj` convention with its own definition.
3. **Partial replacement**: Partial inheritance (overriding only some fields while inheriting others) is allowed.

## Configuration

The configuration in the Zarr convention metadata can be used in these parts of the Zarr hierarchy:

- [x] Group
- [x] Array

|   |Type|Description|Required|Reference|
|---|---|---|---|---|
|**code**|`["string", "null"]`|Authority:code identifier (e.g., EPSG:4326)|No|[code](#code)|
|**wkt2**|`["string", "null"]`|WKT2 (ISO 19162) CRS representation|No|[geo -> wkt2](#wkt2)|
|**projjson**|`any`|PROJJSON CRS representation|No|[geo -> projjson](#projjson)|
|**bbox**|`number` `[]`|Bounding box in CRS coordinates|No|[geo -> bbox](#bbox)|
|**transform**|`number` `[]`|Affine transformation coefficients|No|[geo -> transform](#transform)|
|**spatial_dimensions**|`string` `[2]`|Names of spatial dimensions [y_name, x_name]|&#10003; Yes|[geo -> spatial_dimensions](#spatial_dimensions)|


### Field Details

Additional properties are allowed. 

#### code

Authority:code identifier (e.g., EPSG:4326)

* **Type**: `string | null`
* **Required**: No
* **Pattern**: `^[A-Z]+:[0-9]+$`

Projection codes are identified by a string. The [proj](https://org/) library defines projections
using "authority:code", e.g., "EPSG:4326" or "IAU_2015:30100". Different projection authorities may define
different string formats. Examples of known projection authorities, where when can find well known codes that
clients are likely to support are listed in the following table.

| Authority Name                          | URL                                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| European Petroleum Survey Groups (EPSG) | <http://www.opengis.net/def/crs/EPSG> or <http://epsg.org> |
| International Astronomical Union (IAU)  | <http://www.opengis.net/def/crs/IAU>                       |
| Open Geospatial Consortium (OGC)        | <http://www.opengis.net/def/crs/OGC>                       |
| ESRI                                    | <https://spatialreference.org/ref/esri/>                   |

The `code` field SHOULD be set to `null` or omitted in the following cases:

- The data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid EPSG code for it. In this case, the CRS should be provided in `wkt2` and/or `projjson`.

Clients can prefer to take either, although there may be discrepancies in how each might be interpreted.

The `code` field MUST NOT be set to `null` or unset if both the `wkt2` field or `projjson` fields are set to `null` or unset.

#### wkt2

WKT2 (ISO 19162) CRS representation

* **Type**: `string | null`
* **Required**: No

A Coordinate Reference System (CRS) is the data reference system (sometimes called a 'projection')
used by the asset data. This value is a [WKT2](http://docs.opengeospatial.org/is/12-063r5/12-063r5.html) string.

This field SHOULD be set to `null` or omitted in the following cases:

- The asset data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid WKT2 string for it.

The `wkt2` field MUST NOT be set to `null` or unset if both the `code` field or `projjson` fields are set to `null` or unset.

#### projjson

PROJJSON CRS representation

* **Type**: `object | null`
* **Required**: No

A Coordinate Reference System (CRS) is the data reference system (sometimes called a 'projection')
used by the asset data. This value is a [PROJJSON](https://org/specifications/projjson.html) object,
see the [JSON Schema](https://org/schemas/v0.7/projjson.schema.json) for details.

This field SHOULD be set to `null` or omitted in the following cases:

- The asset data does not have a CRS, such as in the case of non-rectified imagery with Ground Control Points.
- A CRS exists, but there is no valid PROJJSON for it.

The `projjson` field MUST NOT be set to `null` or unset if both the `code` field or `wkt2` fields are set to `null` or unset.

#### bbox

Bounding box in CRS coordinates

* **Type**: `number[4] | null`
* **Required**: No

Bounding box of the assets represented by this Item in the asset data CRS. Specified as 4 numbers
based on the CRS defined in the `code`, `projjson` or `wkt2` fields. The first two numbers are coordinates
of the lower left corner, followed by coordinates of upper right corner, , e.g., \[west, south, east, north],
\[xmin, ymin, xmax, ymax], \[left, down, right, up], or \[west, south, lowest, east, north, highest].
The length of the array must be 2\*n where n is the number of dimensions. The array contains all axes of the southwesterly
most extent followed by all axes of the northeasterly most extent specified in Longitude/Latitude
based on [WGS 84](http://www.opengis.net/def/crs/OGC/1.3/CRS84).

#### transform

Affine transformation coefficients

* **Type**: `number[6] | null`
* **Required**: No

Linear mapping from pixel coordinate space (Pixel, Line) to projection coordinate space (Xp, Yp). It is
a `3x3` matrix stored as a flat array of 9 elements in row major order. Since the last row is always `0,0,1` it can be omitted,
in which case only 6 elements are recorded. This mapping can be obtained from 
GDAL([`GetGeoTransform`](https://gdal.org/api/gdaldataset_cpp.html#_CPPv4N11GDALDataset15GetGeoTransformEPd), requires re-ordering)
or the Rasterio ([`Transform`](https://rasterio.readthedocs.io/en/stable/api/rasterio.io.html#rasterio.io.BufferedDatasetWriter.transform)).
To get it on the command line you can use the [Rasterio CLI](https://rasterio.readthedocs.io/en/latest/cli.html) with the
[info](https://rasterio.readthedocs.io/en/latest/cli.html#info) command: `$ rio info`.

```txt
  [Xp]   [a0, a1, a2]   [Pixel]
  [Yp] = [a3, a4, a5] * [Line ]
  [1 ]   [0 ,  0,  1]   [1    ]
```

If the transform is defined in Item Properties, it is used as the default transform for all assets that don't have an overriding transform.

Note that `GetGeoTransform` and `rasterio` use different formats for reporting transform information. Order expected in `transform` is the same as reported by `rasterio`. When using GDAL method you need to re-order in the following way:

```python
g = GetGeoTransform(...)
proj_transform = [g[1], g[2], g[0],
                  g[4], g[5], g[3],
                     0,    0,    1]
```

#### spatial_dimensions

Names of spatial dimensions [y_name, x_name]

* **Type**: `[string [2], null]`
* **Required**: No

See the [Spatial Dimension Identification](#spatial-dimension-identification) section below for details on how spatial dimensions are identified.

Note: The shape of spatial dimensions is obtained directly from the Zarr array metadata once the spatial dimensions are identified.

## FAQ

### Why does the "geo:proj" convention allow inheritance from a group to direct child arrays?

The inheritance model addresses a fundamental pattern in geospatial data organization: multiple arrays (e.g., different bands, variables, or time steps) often share the same coordinate reference system and spatial grid. By defining `geo:proj` at the group level, users can:

1. **Reduce redundancy**: Avoid duplicating identical CRS metadata across multiple arrays
2. **Ensure consistency**: Guarantee that all related arrays use the same projection definition
3. **Simplify management**: Update projection metadata in one location rather than across many arrays
4. **Match common practice**: Align with how geospatial tools like GDAL organize multi-band rasters and how formats like NetCDF/HDF5 structure data

This pattern is especially valuable for satellite imagery, climate models, and other geospatial datasets where dozens or hundreds of arrays share identical spatial properties.

### Why does the "geo:proj" convention not support multi-level inheritance (e.g., from a group to grand-child arrays)?

Limiting inheritance to direct children keeps the convention simple and predictable:

1. **Clear scope**: Users can immediately understand which arrays inherit projection metadata by looking at the group's direct children
2. **Avoid ambiguity**: Multi-level inheritance would require complex rules for handling intermediate groups that may or may not define their own projections
3. **Explicit organization**: Zarr hierarchies can be arbitrarily deep; limiting inheritance to one level encourages intentional data organization
4. **Implementation simplicity**: Parsers only need to check one level up, not traverse the entire hierarchy

If nested groups need the same projection, users can either:
- Define `geo:proj` at each group level where needed (e.g. multlscale datasets)
- Restructure their hierarchy to keep related arrays as direct children of a common parent

### Why does the "geo:proj" convention support child arrays overriding parent group "geo:proj" definitions?

Array-level overrides provide necessary flexibility for real-world use cases:

1. **Subsets and crops**: An array might represent a spatial subset with different bounds or transform than the group default
2. **Multi-resolution data**: Different resolution arrays may have different transforms while sharing the same CRS code
3. **Legacy data migration**: When importing data, some arrays might have unique projection properties that need preservation

Without override capability, users would be forced to create separate groups for each variation, leading to unnecessarily fragmented hierarchies.

### Why does the "geo:proj" convention support partial overrides?

Partial inheritance (where arrays can override specific fields while inheriting others) provides fine-grained control:

1. **Field independence**: Different fields serve different purposes - an array might share the `code` but have a unique `transform` or `bbox`
2. **Common scenarios**: 
   - Multiple arrays in the same CRS (`code`) but with different spatial extents (`bbox`)
   - Arrays with identical transforms but different bounding boxes
   - Subsampled data sharing the CRS but with modified transform coefficients
3. **Efficiency**: Users only specify what's different, reducing verbosity and maintenance burden
4. **Backward compatibility**: New optional fields can be added without requiring full redefinition

This design follows the principle of "declare what's different, inherit what's common," making the convention more practical for real geospatial workflows.

## Acknowledgements

The template is based on the [STAC extensions template](https://github.com/stac-extensions/template/blob/main/README.md).

The convention was copied and modified from  
https://github.com/zarr-developers/zarr-extensions/pull/21 and [https://github.com/EOPF-Explorer/data-model/blob/main/attributes/geo/proj/](https://github.com/EOPF-Explorer/data-model/blob/main/attributes/geo/proj/).
