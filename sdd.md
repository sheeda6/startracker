Software Design Document (SDD)

Part 1 — System Design

1. Introduction
2. Purpose
3. Design Goals
4. Software Architecture
5. Design Principles
6. Data Flow
7. Execution Flow

Part 2 — Module Design

8. Frontend
9. Astronomy Engine
10. Catalog Engine
11. Rendering Engine
12. Backend
13. Shared Utilities

Part 3 — Data Design

14. Common Data Structures
15. Binary Catalog Format
16. Object Models
17. Coordinate Models
18. State Management

Part 4 — Interface Design

19. Rust Public API
20. WebAssembly Interface
21. TypeScript Interfaces
22. Backend API

Part 5 — Internal Algorithms

23. Coordinate Conversion
24. Rise/Set Algorithms
25. Visibility Algorithm
26. Search Algorithm
27. Rendering Pipeline

Part 6 — Implementation

28. Project Structure
29. Build System
30. Coding Standards
31. Error Handling
32. Logging
33. Testing Strategy

# Part 1 — System Design

---

# 1. Introduction

## 1.1 Purpose

This document describes the internal software design of the application.

Where the Software Requirements Specification (SRS) defines the required functionality, this document specifies how that functionality shall be implemented.

It serves as the primary reference during software development.

---

## 1.2 Scope

This document describes:

- Software architecture
- Internal modules
- Component interactions
- Data flow
- Public interfaces
- Internal algorithms
- Source code organization

Scientific formulas and user requirements are defined in the SRS and are not repeated here unless required for implementation.

---

# 2. Design Goals

The software shall be designed to achieve the following objectives.

## Performance

The application shall minimize CPU usage, memory allocations, and unnecessary data copying while maintaining smooth real-time rendering.

---

## Maintainability

Each subsystem shall have a single, clearly defined responsibility.

Dependencies between modules shall be minimized.

---

## Modularity

Scientific calculations, rendering, catalog management, and user interface logic shall remain independent.

Modules shall communicate only through well-defined public interfaces.

---

## Reliability

Recoverable failures shall not terminate the application.

Errors shall be propagated to the appropriate subsystem for handling.

---

## Determinism

Given identical input values, every computational module shall produce identical output.

No module shall depend on hidden global state.

---

# 3. Software Architecture

The application consists of four primary modules.

## Frontend

Responsibilities:

- User interface
- User interaction
- State management
- Display of astronomical data

Technology:

- React
- TypeScript

---

## Astronomy Engine

Responsibilities:

- Time calculations
- Coordinate transformations
- Rise and set calculations
- Visibility calculations
- Ephemerides

Technology:

- Rust
- WebAssembly

---

## Catalog Engine

Responsibilities:

- Catalog loading
- Binary parsing
- Search
- Filtering
- Object lookup

Technology:

- Rust

---

## Rendering Engine

Responsibilities:

- WebGL rendering
- Camera
- Labels
- Coordinate grids
- Horizon rendering

Technology:

- TypeScript
- WebGL2

---

# 4. Design Principles

The implementation shall follow the principles below.

## Single Responsibility

Each module shall perform one primary task.

Example:

- Astronomy Engine computes positions.

- Rendering Engine displays positions.

---

## Separation of Concerns

Rendering code shall not contain astronomical calculations.

Astronomical code shall not depend on user interface components.

---

## Immutable Data

Catalog data shall remain read-only after loading.

Processing functions shall avoid modifying shared data.

---

## Explicit Interfaces

Communication between modules shall occur only through public APIs.

Modules shall not directly access another module's internal implementation.

---

## Minimal Memory Allocation

Frequently executed code shall avoid dynamic memory allocation.

Temporary objects shall be minimized.

---

# 5. Data Flow

The application processes data in the following sequence.

1.

Load binary catalogs.

↓

2.

Load planetary and satellite data.

↓

3.

Initialize WebAssembly.

↓

4.

Set observer location.

↓

5.

Set current time.

↓

6.

Astronomy Engine computes object positions.

↓

7.

Rendering Engine generates the frame.

↓

8.

React updates the user interface.

The data flow shall remain unidirectional.

---

# 6. Execution Flow

Application startup shall follow this sequence.

1.

Initialize React.

2.

Initialize WebAssembly.

3.

Load catalogs.

4.

Load ephemerides.

5.

Load TLE data.

6.

Initialize application state.

7.

Create WebGL renderer.

8.

Render first frame.

After initialization, the application shall enter the normal update loop.

---

# 7. Update Loop

Each frame shall execute the following operations.

1.

Read user input.

2.

Update simulation time.

3.

Recompute celestial positions.

4.

Update visible objects.

5.

Generate rendering buffers.

6.

Render frame.

7.

Update user interface.

Only modified data shall be recalculated whenever possible.

---

# End of Part 1


# Part 2 — Module Design

---

# 8. Frontend Module

## 8.1 Purpose

The Frontend Module provides the graphical user interface and manages all user interactions.

It is responsible for presenting data returned by the WebAssembly module and forwarding user input to the appropriate subsystem.

---

## 8.2 Responsibilities

The Frontend Module shall:

- Render the application interface.
- Manage application state.
- Process user input.
- Display astronomical data.
- Communicate with the WebAssembly module.
- Control the Rendering Engine.

The Frontend Module shall not perform astronomical calculations.

---

## 8.3 Internal Modules

The frontend shall be organized into the following modules.

| Module | Responsibility |
|---------|----------------|
| UI | User interface components |
| State | Global application state |
| Renderer | WebGL renderer |
| Services | Communication with WebAssembly and backend |
| Utilities | Shared helper functions |

---

## 8.4 Dependencies

The Frontend depends on:

- React
- TypeScript
- Zustand
- WebAssembly Module
- WebGL2

---

# 9. Astronomy Engine

## 9.1 Purpose

The Astronomy Engine performs all scientific calculations.

It is implemented in Rust and compiled to WebAssembly.

---

## 9.2 Responsibilities

The Astronomy Engine shall:

- Compute celestial positions.
- Convert coordinate systems.
- Calculate rise, transit, and set times.
- Compute visibility.
- Calculate planetary positions.
- Calculate lunar positions.
- Calculate satellite positions.
- Calculate asteroid positions.
- Calculate comet positions.

---

## 9.3 Internal Modules

| Module | Responsibility |
|---------|----------------|
| Time | Time systems and conversions |
| Coordinates | Coordinate transformations |
| Stars | Stellar calculations |
| Planets | Planetary ephemerides |
| Moon | Lunar ephemerides |
| Satellites | TLE propagation |
| Asteroids | Asteroid ephemerides |
| Comets | Comet ephemerides |
| Visibility | Rise, set, and visibility calculations |

Each module shall be independent and expose a public API.

---

## 9.4 Dependencies

The Astronomy Engine may depend on:

- nalgebra
- chrono
- serde
- wasm-bindgen

No module shall depend on frontend code.

---

# 10. Catalog Engine

## 10.1 Purpose

The Catalog Engine manages all astronomical datasets.

---

## 10.2 Responsibilities

The Catalog Engine shall:

- Load binary catalogs.
- Validate datasets.
- Build search indexes.
- Provide object lookup.
- Cache loaded data.

---

## 10.3 Managed Datasets

The Catalog Engine shall manage:

- Hipparcos Catalog
- Bright Star Catalog
- Messier Catalog
- NGC Catalog
- Planetary ephemerides
- Lunar ephemerides
- Satellite TLE data
- Asteroid ephemerides
- Comet ephemerides

---

## 10.4 Dependencies

The Catalog Engine shall provide read-only data to the Astronomy Engine.

The Rendering Engine shall not access catalog files directly.

---

# 11. Rendering Engine

## 11.1 Purpose

The Rendering Engine converts celestial positions into an interactive visual representation.

---

## 11.2 Responsibilities

The Rendering Engine shall:

- Render celestial objects.
- Render labels.
- Render grids.
- Render the horizon.
- Manage the camera.
- Process object selection.

---

## 11.3 Internal Modules

| Module | Responsibility |
|---------|----------------|
| Camera | View control |
| Projection | Screen projection |
| Objects | Celestial object rendering |
| Labels | Text rendering |
| Grid | Coordinate grids |
| Horizon | Horizon rendering |
| Selection | Picking and highlighting |

---

## 11.4 Dependencies

The Rendering Engine depends on:

- WebGL2
- GLSL
- Frontend state

It shall not perform astronomical calculations.

---

# 12. Backend Module

## 12.1 Purpose

The backend serves application assets and astronomical datasets.

It contains no scientific computation.

---

## 12.2 Responsibilities

The Backend shall:

- Serve static files.
- Serve binary catalogs.
- Serve ephemerides.
- Serve TLE files.
- Handle caching headers.
- Compress responses.

---

## 12.3 Dependencies

The Backend depends on:

- Actix Web
- Tokio

---

# 13. Shared Utilities

## 13.1 Purpose

Shared Utilities provide reusable functionality used throughout the application.

---

## 13.2 Responsibilities

Utilities may include:

- Unit conversions
- Formatting
- Validation
- Mathematical helpers
- File utilities

Utilities shall contain no application state.

---

# 13.3 Dependency Rules

The dependency hierarchy shall be:

Backend
↓
Catalog Engine
↓
Astronomy Engine
↓
Frontend
↓
Rendering Engine
↓
User Interface

Lower layers shall not depend on higher layers.

Communication between layers shall occur only through public interfaces.

---

# 13.4 Ownership Rules

Each module shall own its own data.

Rules:

- Catalog Engine owns astronomical datasets.
- Astronomy Engine owns computed positions.
- Rendering Engine owns GPU resources.
- Frontend owns application state.
- UI components own only local interface state.

Modules shall exchange immutable data wherever practical.

---

# 13.5 Summary

The software is divided into independent modules with clearly defined responsibilities and ownership. This organization minimizes coupling, improves maintainability, and ensures that computational, rendering, and interface logic remain separate throughout the implementation.

---

**End of Part 2**

# Part 3 — Data Design

---

# 14. Overview

## 14.1 Purpose

This section defines the core data models used throughout the application.

These models represent the canonical data structures exchanged between the Catalog Engine, Astronomy Engine, Rendering Engine, Backend, and Frontend.

All modules shall implement these models consistently.

---

# 15. Common Data Models

## 15.1 Celestial Object

The Celestial Object is the base model representing any astronomical object.

### Fields

| Field | Type | Description |
|--------|------|-------------|
| Object ID | Integer | Unique identifier |
| Object Type | Enumeration | Star, Planet, Moon, Satellite, Asteroid, Comet, DSO |
| Name | String | Primary object name |
| Display Name | String | User-facing name |
| Visible | Boolean | Current visibility state |

Every astronomical object shall inherit these common fields.

---

## 15.2 Object Types

Supported object types:

- Star
- Planet
- Moon
- Artificial Satellite
- Asteroid
- Comet
- Deep-Sky Object

---

# 16. Observer Model

The Observer Model represents the user's observing location.

| Field | Type | Unit |
|--------|------|------|
| Latitude | Float64 | Degrees |
| Longitude | Float64 | Degrees |
| Elevation | Float64 | Meters |
| Time Zone | String | IANA Time Zone |

Only one active observer shall exist during a session.

---

# 17. Time Model

The Time Model represents the current simulation time.

| Field | Type |
|--------|------|
| UTC | Date-Time |
| Julian Date | Float64 |
| Greenwich Sidereal Time | Float64 |
| Local Sidereal Time | Float64 |
| Simulation Speed | Float64 |

UTC shall be the primary time reference.

---

# 18. Coordinate Models

## 18.1 Equatorial Coordinates

| Field | Unit |
|--------|------|
| Right Ascension | Hours |
| Declination | Degrees |

---

## 18.2 Horizontal Coordinates

| Field | Unit |
|--------|------|
| Altitude | Degrees |
| Azimuth | Degrees |

---

## 18.3 Galactic Coordinates

| Field | Unit |
|--------|------|
| Longitude | Degrees |
| Latitude | Degrees |

---

## 18.4 Ecliptic Coordinates

| Field | Unit |
|--------|------|
| Longitude | Degrees |
| Latitude | Degrees |

---

## 18.5 Cartesian Coordinates

| Field | Unit |
|--------|------|
| X | AU |
| Y | AU |
| Z | AU |

---

# 19. Star Model

The Star Model extends the Celestial Object.

| Field | Type |
|--------|------|
| HIP Identifier | Integer |
| Right Ascension | Float64 |
| Declination | Float64 |
| Proper Motion (RA) | Float32 |
| Proper Motion (Dec) | Float32 |
| Parallax | Float32 |
| Distance | Float32 |
| Apparent Magnitude | Float32 |
| Absolute Magnitude | Float32 |
| Spectral Type | String |
| Constellation | String |

---

# 20. Planet Model

The Planet Model extends the Celestial Object.

| Field | Type |
|--------|------|
| Planet Identifier | Integer |
| Heliocentric Position | Cartesian Coordinates |
| Geocentric Position | Cartesian Coordinates |
| Equatorial Coordinates | Equatorial Coordinates |
| Horizontal Coordinates | Horizontal Coordinates |
| Apparent Magnitude | Float32 |
| Angular Diameter | Float32 |
| Distance | Float64 |

---

# 21. Moon Model

The Moon Model extends the Celestial Object.

| Field | Type |
|--------|------|
| Phase | Float32 |
| Illuminated Fraction | Float32 |
| Distance | Float64 |
| Angular Diameter | Float32 |
| Equatorial Coordinates | Equatorial Coordinates |
| Horizontal Coordinates | Horizontal Coordinates |

---

# 22. Satellite Model

The Satellite Model extends the Celestial Object.

| Field | Type |
|--------|------|
| NORAD Identifier | Integer |
| TLE Epoch | Date-Time |
| Inclination | Float64 |
| Eccentricity | Float64 |
| Mean Motion | Float64 |
| Equatorial Coordinates | Equatorial Coordinates |
| Horizontal Coordinates | Horizontal Coordinates |
| Visible | Boolean |

---

# 23. Asteroid Model

The Asteroid Model extends the Celestial Object.

| Field | Type |
|--------|------|
| MPC Identifier | String |
| Absolute Magnitude | Float32 |
| Distance | Float64 |
| Equatorial Coordinates | Equatorial Coordinates |
| Horizontal Coordinates | Horizontal Coordinates |

---

# 24. Comet Model

The Comet Model extends the Celestial Object.

| Field | Type |
|--------|------|
| Designation | String |
| Magnitude | Float32 |
| Distance | Float64 |
| Tail Length | Float32 (optional) |
| Equatorial Coordinates | Equatorial Coordinates |
| Horizontal Coordinates | Horizontal Coordinates |

---

# 25. Deep-Sky Object Model

The Deep-Sky Object Model extends the Celestial Object.

| Field | Type |
|--------|------|
| Catalog | Enumeration |
| Catalog Number | String |
| Object Class | String |
| Right Ascension | Float64 |
| Declination | Float64 |
| Apparent Magnitude | Float32 |
| Angular Size | Float32 |

---

# 26. Application State

The global application state shall contain:

| Component |
|-----------|
| Observer |
| Time |
| Active Coordinate System |
| Selected Object |
| Active Catalogs |
| Display Settings |
| Search State |

The application shall maintain a single source of truth for global state.

---

# 27. Data Ownership

Ownership rules shall be:

| Data | Owner |
|------|-------|
| Catalog Data | Catalog Engine |
| Computed Positions | Astronomy Engine |
| GPU Buffers | Rendering Engine |
| Application State | Frontend |
| User Preferences | Browser Storage |

Modules shall exchange immutable views whenever practical.

---

# 28. Data Lifetime

The lifetime of each data category shall be:

| Data | Lifetime |
|------|----------|
| Catalog Data | Entire application session |
| Observer | Entire application session |
| Time Context | Entire application session |
| Computed Positions | One simulation update |
| Render Buffers | One rendered frame |
| UI State | Until user interaction changes it |

---

# 29. Serialization

Persistent data shall use the following formats:

| Data | Format |
|------|--------|
| Catalogs | Binary |
| Settings | JSON |
| Cached Data | Binary |
| Logs | Text |

Runtime objects shall not be serialized unless explicitly required.

---

# 30. Summary

The application uses a common set of language-independent data models shared across all modules. These models define the structure, ownership, and lifetime of astronomical data while remaining independent of implementation language. This approach ensures consistency between the Rust, WebAssembly, backend, and frontend components of the system.

---

**End of Part 3**

# Part 4 — Interface Design

---

# 31. Overview

## 31.1 Purpose

This section defines the interfaces through which application modules communicate.

Interfaces specify the operations available to other modules without exposing internal implementation details.

All communication between modules shall occur through these public interfaces.

---

# 32. Astronomy Service Interface

## 32.1 Purpose

The Astronomy Service provides all astronomical calculations required by the application.

The service is implemented by the Astronomy Engine and exposed to the frontend through WebAssembly.

---

## 32.2 Operations

| Operation | Description |
|-----------|-------------|
| Initialize | Initialize the astronomy engine |
| Set Observer | Update observer location |
| Set Time | Update simulation time |
| Set Simulation Speed | Change simulation speed |
| Compute Positions | Compute positions of all supported objects |
| Convert Coordinates | Convert between supported coordinate systems |
| Compute Rise/Transit/Set | Compute daily visibility events |
| Compute Visibility | Determine current visibility |
| Get Object Information | Return computed information for a selected object |

---

## 32.3 Input

The Astronomy Service accepts:

- Observer Model
- Time Model
- Selected Coordinate System
- Active Catalogs

---

## 32.4 Output

The Astronomy Service returns:

- Updated object positions
- Rise, transit and set times
- Visibility information
- Coordinate data
- Object metadata

---

# 33. Catalog Service Interface

## 33.1 Purpose

The Catalog Service provides efficient access to astronomical datasets.

---

## 33.2 Operations

| Operation | Description |
|-----------|-------------|
| Load Catalog | Load a binary catalog |
| Unload Catalog | Release catalog resources |
| Search Objects | Search by name or identifier |
| Filter Objects | Apply user filters |
| Retrieve Object | Return complete object data |
| Get Statistics | Return catalog statistics |

---

## 33.3 Input

The Catalog Service accepts:

- Search text
- Filter criteria
- Catalog identifier

---

## 33.4 Output

The Catalog Service returns:

- Matching objects
- Complete object records
- Catalog metadata

---

# 34. Rendering Service Interface

## 34.1 Purpose

The Rendering Service converts astronomical data into graphical output.

---

## 34.2 Operations

| Operation | Description |
|-----------|-------------|
| Initialize Renderer | Create rendering resources |
| Resize Viewport | Update viewport dimensions |
| Update Scene | Refresh renderable objects |
| Render Frame | Draw one frame |
| Select Object | Perform object picking |
| Center Camera | Focus on selected object |
| Update Display Settings | Apply rendering settings |

---

## 34.3 Input

The Rendering Service accepts:

- Computed object positions
- Camera parameters
- Display settings

---

## 34.4 Output

The Rendering Service produces:

- Rendered sky visualization
- Selected object identifier

---

# 35. Backend Service Interface

## 35.1 Purpose

The Backend Service provides application resources and astronomical datasets.

---

## 35.2 Endpoints

| Endpoint | Purpose |
|----------|---------|
| Catalog Data | Binary catalogs |
| Ephemerides | Planetary and lunar data |
| Satellite Data | Current TLE datasets |
| Application Assets | Static application files |
| Version Information | Dataset and application versions |

---

## 35.3 Response Requirements

Responses shall:

- Use HTTPS
- Support compression
- Support caching
- Include version metadata where applicable

---

# 36. Application State Interface

## 36.1 Purpose

The Application State Interface manages shared state used by all frontend components.

---

## 36.2 Managed State

- Observer
- Simulation Time
- Coordinate System
- Selected Object
- Display Settings
- Search State
- Loaded Catalogs

---

## 36.3 State Rules

- Only one global application state shall exist.
- State updates shall be deterministic.
- Components shall react automatically to state changes.
- Components shall not modify shared state directly.

---

# 37. User Interface Interface

## 37.1 Purpose

The User Interface communicates user actions to the application.

---

## 37.2 Supported Actions

- Search object
- Select object
- Change observer location
- Change date and time
- Change simulation speed
- Change coordinate system
- Change display settings
- Zoom
- Pan
- Rotate view

---

## 37.3 Returned Information

The interface shall update:

- Information panel
- Coordinate table
- Sky canvas
- Status bar

---

# 38. Error Interface

## 38.1 Purpose

The Error Interface standardizes error reporting throughout the application.

---

## 38.2 Error Categories

| Category | Description |
|----------|-------------|
| Validation Error | Invalid user input |
| Data Error | Invalid or missing datasets |
| Network Error | Download failures |
| Rendering Error | Graphics subsystem failures |
| Computation Error | Astronomical calculation failures |
| Internal Error | Unexpected application errors |

---

## 38.3 Error Information

Every reported error shall include:

- Error code
- Short description
- Severity
- Recovery recommendation

---

# 39. Interface Contracts

All interfaces shall satisfy the following rules:

- Public operations shall be documented.
- Interfaces shall remain stable between compatible releases.
- Interfaces shall not expose internal implementation details.
- Inputs shall be validated before processing.
- Returned data shall conform to the canonical data models defined in Part 3.

---

# 40. Summary

The application is composed of loosely coupled modules that communicate exclusively through well-defined service interfaces. This architecture enables independent development, simplifies testing, and preserves clear boundaries between the computational, rendering, data management, and user interface subsystems.

---

**End of Part 4**

# Part 5 — Computational Algorithms

---

# 41. Overview

## 41.1 Purpose

This section describes the computational algorithms used by the application.

Algorithms are specified independently of programming language and implementation details.

Each algorithm shall produce deterministic results for identical input data.

---

# 42. Coordinate Transformation Pipeline

## Purpose

Transform celestial coordinates between supported coordinate systems.

---

## Inputs

- Source coordinate system
- Target coordinate system
- Observer location
- Observation time

---

## Outputs

- Transformed coordinates

---

## Processing Steps

1. Validate input coordinates.
2. Convert to the internal reference frame.
3. Apply required astronomical corrections.
4. Transform into the requested coordinate system.
5. Normalize angular values.
6. Return transformed coordinates.

---

## Time Complexity

**O(1)** per object.

---

## Space Complexity

**O(1)**

---

## Numerical Considerations

- Preserve double-precision accuracy.
- Normalize angular ranges after every transformation.
- Avoid cumulative rounding errors.

---

## Validation

Compare transformed coordinates against reference astronomical datasets.

---

# 43. Celestial Position Pipeline

## Purpose

Compute the apparent position of every supported celestial object.

---

## Inputs

- Observer
- Time
- Object ephemerides
- Catalog data

---

## Outputs

- Apparent coordinates
- Distance
- Visibility information

---

## Processing Steps

1. Load object data.
2. Compute reference position.
3. Apply proper motion (where applicable).
4. Apply precession.
5. Apply observer transformation.
6. Apply atmospheric refraction.
7. Compute final apparent position.

---

## Time Complexity

**O(n)**

where **n** is the number of active objects.

---

## Space Complexity

**O(n)**

---

## Validation

Verify calculated positions against accepted astronomical references.

---

# 44. Rise, Transit, and Set Pipeline

## Purpose

Determine daily visibility events for celestial objects.

---

## Inputs

- Observer
- Time
- Apparent position

---

## Outputs

- Rise time
- Transit time
- Set time
- Visibility state

---

## Processing Steps

1. Determine horizon crossing.
2. Compute rise time.
3. Compute upper transit.
4. Compute set time.
5. Detect circumpolar objects.
6. Detect objects that never rise.

---

## Time Complexity

**O(1)** per object.

---

## Space Complexity

**O(1)**

---

## Validation

Compare computed event times with authoritative ephemerides.

---

# 45. Visibility Pipeline

## Purpose

Determine whether an object is currently observable.

---

## Inputs

- Apparent altitude
- User display filters
- Observation time

---

## Outputs

- Visible
- Hidden
- Below horizon

---

## Processing Steps

1. Evaluate altitude.
2. Apply magnitude filter.
3. Apply object-type filters.
4. Determine visibility state.

---

## Time Complexity

**O(1)**

---

## Space Complexity

**O(1)**

---

# 46. Search Pipeline

## Purpose

Locate astronomical objects efficiently.

---

## Inputs

- Search text
- Active catalogs
- Filter settings

---

## Outputs

- Matching object list

---

## Processing Steps

1. Normalize search text.
2. Select searchable catalogs.
3. Execute indexed lookup.
4. Rank matching results.
5. Return sorted list.

---

## Time Complexity

Average:

**O(log n)**

Worst case:

**O(n)**

---

## Space Complexity

**O(k)**

where **k** is the number of returned objects.

---

## Validation

Verify search results against known catalog entries.

---

# 47. Rendering Pipeline

## Purpose

Generate one rendered frame.

---

## Inputs

- Computed positions
- Camera state
- Display settings

---

## Outputs

- Completed frame

---

## Processing Steps

1. Determine visible objects.
2. Project coordinates.
3. Generate render buffers.
4. Render celestial objects.
5. Render labels.
6. Render overlays.
7. Present frame.

---

## Time Complexity

**O(v)**

where **v** is the number of visible objects.

---

## Space Complexity

Depends on active GPU buffers.

---

## Validation

Verify object placement against computed coordinates.

---

# 48. Selection Pipeline

## Purpose

Identify the object selected by the user.

---

## Inputs

- Mouse position
- Camera
- Visible objects

---

## Outputs

- Selected object identifier

---

## Processing Steps

1. Convert screen coordinates.
2. Perform hit testing.
3. Select nearest valid object.
4. Highlight selection.
5. Update information panel.

---

## Time Complexity

Target:

**O(log n)** using spatial indexing.

---

## Validation

Verify that the selected object matches the rendered object under the cursor.

---

# 49. Data Loading Pipeline

## Purpose

Load astronomical datasets into memory.

---

## Inputs

- Binary catalogs
- Ephemerides
- TLE files

---

## Outputs

- Initialized datasets

---

## Processing Steps

1. Read file.
2. Verify format.
3. Validate version.
4. Parse records.
5. Build indexes.
6. Cache datasets.

---

## Time Complexity

**O(n)**

where **n** is the number of records.

---

## Space Complexity

**O(n)**

---

## Validation

Verify record counts, checksums (when available), and required fields before accepting the dataset.

---

# 50. Update Pipeline

## Purpose

Synchronize the application after user interaction or time progression.

---

## Inputs

- User input
- Simulation time
- Observer state

---

## Outputs

- Updated scene
- Updated interface

---

## Processing Steps

1. Detect state changes.
2. Recompute affected objects only.
3. Refresh visible object list.
4. Update render buffers.
5. Render frame.
6. Refresh UI components.

---

## Time Complexity

Dependent on the number of affected objects rather than the total catalog size.

---

## Optimization Strategy

- Recalculate only modified objects.
- Reuse cached transformations where possible.
- Avoid unnecessary GPU uploads.
- Minimize memory allocations during the update cycle.

---

# 51. Summary

The application is organized around deterministic computational pipelines. Each pipeline defines a complete sequence of operations from validated input to verified output, with documented computational complexity and numerical considerations. This structure promotes consistent implementation, facilitates testing, and provides clear guidance for performance optimization.

---

**End of Part 5**

# Part 6 — Development Standards

---

# 53. Overview

## 53.1 Purpose

This section defines the engineering standards, coding practices, project organization, and development workflow for the application.

All source code shall conform to these standards throughout the project lifecycle.

---

# 54. Project Organization

The project shall be organized into independent components with clear responsibilities.

```
project-root/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── assets/
│   └── tests/
│
├── astronomy/
│   ├── src/
│   ├── tests/
│   └── benches/
│
├── backend/
│   ├── src/
│   ├── config/
│   └── tests/
│
├── catalogs/
│
├── scripts/
│
├── documentation/
│
└── tools/
```

Each directory shall have a single well-defined purpose.

---

# 55. Build System

The application shall use separate build processes for each major component.

| Component | Build Tool |
|----------|------------|
| Frontend | Vite |
| Astronomy Engine | Cargo |
| Backend | Cargo |
| WebAssembly | wasm-pack |

Production builds shall enable compiler optimizations.

Debug builds shall include debugging symbols.

---

# 56. Coding Standards

All source code shall:

- Follow language-specific style guides.
- Be formatted automatically before committing.
- Avoid unnecessary complexity.
- Avoid duplicated logic.
- Prefer readability over clever implementations.
- Include descriptive comments only where necessary.

---

## Rust Standards

Rust code shall:

- Prefer ownership over shared mutable state.
- Avoid unnecessary cloning.
- Minimize heap allocations.
- Use explicit error handling.
- Keep functions focused on a single responsibility.
- Document all public items.

---

## TypeScript Standards

TypeScript code shall:

- Use strict type checking.
- Avoid the `any` type.
- Prefer immutable objects.
- Keep components focused and reusable.
- Document exported interfaces.

---

# 57. Naming Conventions

Consistent naming shall be used throughout the project.

| Item | Convention |
|------|------------|
| Variables | camelCase |
| Functions | camelCase |
| Types | PascalCase |
| Classes | PascalCase |
| Interfaces | PascalCase |
| Constants | UPPER_SNAKE_CASE |
| Files | kebab-case |
| Directories | lowercase |

Names shall be descriptive and avoid unnecessary abbreviations.

---

# 58. Error Handling

Errors shall be categorized into:

- Validation Errors
- Data Errors
- Network Errors
- Rendering Errors
- Internal Errors

Each error shall include:

- Error code
- Description
- Severity
- Suggested recovery action

Recoverable errors shall not terminate the application.

---

# 59. Logging

Logging shall be used for diagnostics and debugging.

Logs may include:

- Startup events
- Dataset loading
- Configuration changes
- Performance metrics
- Runtime errors

Logs shall not contain personal user information.

---

# 60. Testing Organization

Testing shall be organized into separate suites.

| Test Suite | Purpose |
|------------|---------|
| Unit Tests | Individual modules |
| Integration Tests | Module interaction |
| System Tests | Complete application |
| Performance Tests | Runtime efficiency |
| Scientific Validation | Astronomical correctness |

Automated testing shall be integrated into the build process.

---

# 61. Documentation Standards

The project shall maintain documentation for:

- Public APIs
- Configuration options
- Data formats
- Build instructions
- Deployment procedures

Documentation shall be updated whenever public behavior changes.

---

# 62. Version Control

Version control shall use Git.

The primary branches shall be:

- `main` — Stable production code
- `develop` — Ongoing development

Feature development shall occur in separate branches and be merged through pull requests.

---

# 63. Code Review

Every change shall undergo review before merging.

Reviews shall verify:

- Correctness
- Readability
- Performance impact
- Consistency with coding standards
- Adequate testing
- Documentation updates

---

# 64. Performance Profiling

Performance profiling shall focus on:

- CPU usage
- Memory allocation
- WebAssembly execution time
- Rendering performance
- Application startup time

Optimization shall be based on measured performance rather than assumptions.

---

# 65. Dependency Management

External dependencies shall:

- Be actively maintained.
- Have compatible licenses.
- Be version-pinned where appropriate.
- Be reviewed before introduction.

Unused dependencies shall be removed promptly.

---

# 66. Security Practices

Development shall follow basic security principles.

The application shall:

- Validate all external input.
- Use HTTPS for network communication.
- Avoid exposing internal implementation details.
- Store only necessary user preferences locally.
- Keep third-party dependencies updated.

---

# 67. Release Process

Each release shall include:

- Successful production build
- Passing automated tests
- Successful scientific validation
- Updated documentation
- Updated version information
- Release notes

No release shall proceed with unresolved critical defects.

---

# 68. Summary

The development standards defined in this document establish a consistent engineering process for the project. They ensure that the codebase remains maintainable, reliable, performant, and well documented while supporting collaborative development and long-term maintenance.

---

# End of Software Design Document