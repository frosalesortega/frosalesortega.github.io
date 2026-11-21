---
name: "PINGSoft"
summary: "PINGSoft 2: an IDL Integral Field Spectroscopy Software."
language: "IDL"
license: "GPLv3"
status: "Released (v2, 2012)"
docs: "https://calmecac.inaoep.mx/~frosales/pings/media/PINGSoft_User_Guide.pdf"
downloads:
  - label: "PINGSoft v2 (tar.gz)"
    url: "https://calmecac.inaoep.mx/~frosales/pings/media/pingsoft_v2.tar.gz"
  - label: "User's Guide (PDF)"
    url: "https://calmecac.inaoep.mx/~frosales/pings/media/PINGSoft_User_Guide.pdf"
  - label: "Examples (tar.gz, about 30 MB)"
    url: "https://calmecac.inaoep.mx/~frosales/pings/media/pingsoft_examples.tar.gz"
paper: "2011NewA...16..220R"
project: "pings"
order: 3
---
PINGSoft is a set of IDL routines to visualise, manipulate and analyse integral field spectroscopy (IFS) data in 3D cube or Raw Stacked Spectra (RSS) format. Any IFS data can be adapted, regardless of the original format and the size or shape of the spaxels. It works natively with data from the CALIFA survey. I am the sole author. The last version (v2) is dated 5 November 2012, and the software is released under the GPLv3 licence.

Version 2 features:

- an interactive widget to explore the spaxels and spectra of a cube or RSS file;
- radial binning, with fixed bins or a signal-to-noise floor;
- extraction and integration of spectra with a user-defined mask;
- spectra extraction in elliptical, conic or hyperbolic apertures;
- selection of spectra by signal-to-noise in the continuum and/or in emission lines;
- correction of the intrinsic velocity field by wavelength cross-correlation;
- Voronoi binning (method of Cappellari & Copin 2003);
- convolution with narrow- and broad-band filters.

To cite: Rosales-Ortega, F. F. (2011), *New Astronomy*, 16, 220 (bibcode 2011NewA...16..220R).
