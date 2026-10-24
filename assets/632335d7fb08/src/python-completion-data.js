// Captured from the lab browser runtime: NumPy 2.2.5. Suggestions require no runtime or network.
export const PYTHON_COMPLETIONS={
 "numpy": [
  {
   "label": "array",
   "type": "function",
   "signature": "array(object, dtype=None, *, copy=True, order='K', subok=False, ndmin=0,",
   "doc": "Create an array."
  },
  {
   "label": "asarray",
   "type": "function",
   "signature": "asarray(a, dtype=None, order=None, *, device=None, copy=None, like=None)",
   "doc": "Convert the input to an array."
  },
  {
   "label": "arange",
   "type": "function",
   "signature": "arange([start,] stop[, step,], dtype=None, *, device=None, like=None)",
   "doc": "Return evenly spaced values within a given interval."
  },
  {
   "label": "linspace",
   "type": "function",
   "signature": "linspace(start, stop, num=50, endpoint=True, retstep=False, dtype=None, axis=0, *, device=None)",
   "doc": "Return evenly spaced numbers over a specified interval."
  },
  {
   "label": "logspace",
   "type": "function",
   "signature": "logspace(start, stop, num=50, endpoint=True, base=10.0, dtype=None, axis=0)",
   "doc": "Return numbers spaced evenly on a log scale."
  },
  {
   "label": "zeros",
   "type": "function",
   "signature": "zeros(shape, dtype=float, order='C', *, like=None)",
   "doc": "Return a new array of given shape and type, filled with zeros."
  },
  {
   "label": "zeros_like",
   "type": "function",
   "signature": "zeros_like(a, dtype=None, order='K', subok=True, shape=None, *, device=None)",
   "doc": "Return an array of zeros with the same shape and type as a given array."
  },
  {
   "label": "ones",
   "type": "function",
   "signature": "ones(shape, dtype=None, order='C', *, device=None, like=None)",
   "doc": "Return a new array of given shape and type, filled with ones."
  },
  {
   "label": "ones_like",
   "type": "function",
   "signature": "ones_like(a, dtype=None, order='K', subok=True, shape=None, *, device=None)",
   "doc": "Return an array of ones with the same shape and type as a given array."
  },
  {
   "label": "empty",
   "type": "function",
   "signature": "empty(shape, dtype=float, order='C', *, device=None, like=None)",
   "doc": "Return a new array of given shape and type, without initializing entries."
  },
  {
   "label": "empty_like",
   "type": "function",
   "signature": "empty_like(prototype, dtype=None, order='K', subok=True, shape=None, *,",
   "doc": "Return a new array with the same shape and type as a given array."
  },
  {
   "label": "full",
   "type": "function",
   "signature": "full(shape, fill_value, dtype=None, order='C', *, device=None, like=None)",
   "doc": "Return a new array of given shape and type, filled with `fill_value`."
  },
  {
   "label": "full_like",
   "type": "function",
   "signature": "full_like(a, fill_value, dtype=None, order='K', subok=True, shape=None, *, device=None)",
   "doc": "Return a full array with the same shape and type as a given array."
  },
  {
   "label": "eye",
   "type": "function",
   "signature": "eye(N, M=None, k=0, dtype=<class 'float'>, order='C', *, device=None, like=None)",
   "doc": "Return a 2-D array with ones on the diagonal and zeros elsewhere."
  },
  {
   "label": "identity",
   "type": "function",
   "signature": "identity(n, dtype=None, *, like=None)",
   "doc": "Return the identity array."
  },
  {
   "label": "concatenate",
   "type": "function",
   "signature": "concatenate(arrays, axis=0, out=None, *, dtype=None, casting='same_kind')",
   "doc": ")"
  },
  {
   "label": "stack",
   "type": "function",
   "signature": "stack(arrays, axis=0, out=None, *, dtype=None, casting='same_kind')",
   "doc": "Join a sequence of arrays along a new axis."
  },
  {
   "label": "hstack",
   "type": "function",
   "signature": "hstack(tup, *, dtype=None, casting='same_kind')",
   "doc": "Stack arrays in sequence horizontally (column wise)."
  },
  {
   "label": "vstack",
   "type": "function",
   "signature": "vstack(tup, *, dtype=None, casting='same_kind')",
   "doc": "Stack arrays in sequence vertically (row wise)."
  },
  {
   "label": "dstack",
   "type": "function",
   "signature": "dstack(tup)",
   "doc": "Stack arrays in sequence depth wise (along third axis)."
  },
  {
   "label": "column_stack",
   "type": "function",
   "signature": "column_stack(tup)",
   "doc": "Stack 1-D arrays as columns into a 2-D array."
  },
  {
   "label": "split",
   "type": "function",
   "signature": "split(ary, indices_or_sections, axis=0)",
   "doc": "Split an array into multiple sub-arrays as views into `ary`."
  },
  {
   "label": "hsplit",
   "type": "function",
   "signature": "hsplit(ary, indices_or_sections)",
   "doc": "Split an array into multiple sub-arrays horizontally (column-wise)."
  },
  {
   "label": "vsplit",
   "type": "function",
   "signature": "vsplit(ary, indices_or_sections)",
   "doc": "Split an array into multiple sub-arrays vertically (row-wise)."
  },
  {
   "label": "reshape",
   "type": "function",
   "signature": "reshape(a, /, shape=None, order='C', *, newshape=None, copy=None)",
   "doc": "Gives a new shape to an array without changing its data."
  },
  {
   "label": "ravel",
   "type": "function",
   "signature": "ravel(a, order='C')",
   "doc": "Return a contiguous flattened array."
  },
  {
   "label": "transpose",
   "type": "function",
   "signature": "transpose(a, axes=None)",
   "doc": "Returns an array with axes transposed."
  },
  {
   "label": "moveaxis",
   "type": "function",
   "signature": "moveaxis(a, source, destination)",
   "doc": "Move axes of an array to new positions."
  },
  {
   "label": "squeeze",
   "type": "function",
   "signature": "squeeze(a, axis=None)",
   "doc": "Remove axes of length one from `a`."
  },
  {
   "label": "expand_dims",
   "type": "function",
   "signature": "expand_dims(a, axis)",
   "doc": "Expand the shape of an array."
  },
  {
   "label": "append",
   "type": "function",
   "signature": "append(arr, values, axis=None)",
   "doc": "Append values to the end of an array."
  },
  {
   "label": "insert",
   "type": "function",
   "signature": "insert(arr, obj, values, axis=None)",
   "doc": "Insert values along the given axis before the given indices."
  },
  {
   "label": "delete",
   "type": "function",
   "signature": "delete(arr, obj, axis=None)",
   "doc": "Return a new array with sub-arrays along an axis deleted. For a one"
  },
  {
   "label": "where",
   "type": "function",
   "signature": "where(condition, [x, y], /)",
   "doc": "Return elements chosen from `x` or `y` depending on `condition`."
  },
  {
   "label": "nonzero",
   "type": "function",
   "signature": "nonzero(a)",
   "doc": "Return the indices of the elements that are non-zero."
  },
  {
   "label": "argwhere",
   "type": "function",
   "signature": "argwhere(a)",
   "doc": "Find the indices of array elements that are non-zero, grouped by element."
  },
  {
   "label": "sort",
   "type": "function",
   "signature": "sort(a, axis=-1, kind=None, order=None, *, stable=None)",
   "doc": "Return a sorted copy of an array."
  },
  {
   "label": "argsort",
   "type": "function",
   "signature": "argsort(a, axis=-1, kind=None, order=None, *, stable=None)",
   "doc": "Returns the indices that would sort an array."
  },
  {
   "label": "unique",
   "type": "function",
   "signature": "unique(ar, return_index=False, return_inverse=False, return_counts=False, axis=None, *, equal_nan=True)",
   "doc": "Find the unique elements of an array."
  },
  {
   "label": "sum",
   "type": "function",
   "signature": "sum(a, axis=None, dtype=None, out=None, keepdims=<no value>, initial=<no value>, where=<no value>)",
   "doc": "Sum of array elements over a given axis."
  },
  {
   "label": "mean",
   "type": "function",
   "signature": "mean(a, axis=None, dtype=None, out=None, keepdims=<no value>, *, where=<no value>)",
   "doc": "Compute the arithmetic mean along the specified axis."
  },
  {
   "label": "median",
   "type": "function",
   "signature": "median(a, axis=None, out=None, overwrite_input=False, keepdims=False)",
   "doc": "Compute the median along the specified axis."
  },
  {
   "label": "std",
   "type": "function",
   "signature": "std(a, axis=None, dtype=None, out=None, ddof=0, keepdims=<no value>, *, where=<no value>, mean=<no value>, correction=<no value>)",
   "doc": "Compute the standard deviation along the specified axis."
  },
  {
   "label": "var",
   "type": "function",
   "signature": "var(a, axis=None, dtype=None, out=None, ddof=0, keepdims=<no value>, *, where=<no value>, mean=<no value>, correction=<no value>)",
   "doc": "Compute the variance along the specified axis."
  },
  {
   "label": "min",
   "type": "function",
   "signature": "min(a, axis=None, out=None, keepdims=<no value>, initial=<no value>, where=<no value>)",
   "doc": "Return the minimum of an array or minimum along an axis."
  },
  {
   "label": "max",
   "type": "function",
   "signature": "max(a, axis=None, out=None, keepdims=<no value>, initial=<no value>, where=<no value>)",
   "doc": "Return the maximum of an array or maximum along an axis."
  },
  {
   "label": "argmin",
   "type": "function",
   "signature": "argmin(a, axis=None, out=None, *, keepdims=<no value>)",
   "doc": "Returns the indices of the minimum values along an axis."
  },
  {
   "label": "argmax",
   "type": "function",
   "signature": "argmax(a, axis=None, out=None, *, keepdims=<no value>)",
   "doc": "Returns the indices of the maximum values along an axis."
  },
  {
   "label": "dot",
   "type": "function",
   "signature": "dot(a, b, out=None)",
   "doc": "Dot product of two arrays. Specifically,"
  },
  {
   "label": "matmul",
   "type": "function",
   "signature": "matmul(*args, **kwargs)",
   "doc": "Matrix product of two arrays."
  },
  {
   "label": "cross",
   "type": "function",
   "signature": "cross(a, b, axisa=-1, axisb=-1, axisc=-1, axis=None)",
   "doc": "Return the cross product of two (arrays of) vectors."
  },
  {
   "label": "einsum",
   "type": "function",
   "signature": "einsum(*operands, out=None, optimize=False, **kwargs)",
   "doc": "Evaluates the Einstein summation convention on the operands."
  },
  {
   "label": "sqrt",
   "type": "function",
   "signature": "sqrt(*args, **kwargs)",
   "doc": "Return the non-negative square-root of an array, element-wise."
  },
  {
   "label": "exp",
   "type": "function",
   "signature": "exp(*args, **kwargs)",
   "doc": "Calculate the exponential of all elements in the input array."
  },
  {
   "label": "log",
   "type": "function",
   "signature": "log(*args, **kwargs)",
   "doc": "Natural logarithm, element-wise."
  },
  {
   "label": "sin",
   "type": "function",
   "signature": "sin(*args, **kwargs)",
   "doc": "Trigonometric sine, element-wise."
  },
  {
   "label": "cos",
   "type": "function",
   "signature": "cos(*args, **kwargs)",
   "doc": "Cosine element-wise."
  },
  {
   "label": "tan",
   "type": "function",
   "signature": "tan(*args, **kwargs)",
   "doc": "Compute tangent element-wise."
  },
  {
   "label": "abs",
   "type": "function",
   "signature": "abs(*args, **kwargs)",
   "doc": "absolute(x, /, out=None, *, where=True, casting='same_kind', order='K', dtype=None, subok=True[, signature])"
  },
  {
   "label": "clip",
   "type": "function",
   "signature": "clip(a, a_min=<no value>, a_max=<no value>, out=None, *, min=<no value>, max=<no value>, **kwargs)",
   "doc": "Clip (limit) the values in an array."
  },
  {
   "label": "round",
   "type": "function",
   "signature": "round(a, decimals=0, out=None)",
   "doc": "Evenly round to the given number of decimals."
  },
  {
   "label": "isclose",
   "type": "function",
   "signature": "isclose(a, b, rtol=1e-05, atol=1e-08, equal_nan=False)",
   "doc": "Returns a boolean array where two arrays are element-wise equal within a"
  },
  {
   "label": "allclose",
   "type": "function",
   "signature": "allclose(a, b, rtol=1e-05, atol=1e-08, equal_nan=False)",
   "doc": "Returns True if two arrays are element-wise equal within a tolerance."
  },
  {
   "label": "isnan",
   "type": "function",
   "signature": "isnan(*args, **kwargs)",
   "doc": "Test element-wise for NaN and return result as a boolean array."
  },
  {
   "label": "isinf",
   "type": "function",
   "signature": "isinf(*args, **kwargs)",
   "doc": "Test element-wise for positive or negative infinity."
  },
  {
   "label": "all",
   "type": "function",
   "signature": "all(a, axis=None, out=None, keepdims=<no value>, *, where=<no value>)",
   "doc": "Test whether all array elements along a given axis evaluate to True."
  },
  {
   "label": "any",
   "type": "function",
   "signature": "any(a, axis=None, out=None, keepdims=<no value>, *, where=<no value>)",
   "doc": "Test whether any array element along a given axis evaluates to True."
  },
  {
   "label": "load",
   "type": "function",
   "signature": "load(file, mmap_mode=None, allow_pickle=False, fix_imports=True, encoding='ASCII', *, max_header_size=10000)",
   "doc": "Load arrays or pickled objects from ``.npy``, ``.npz`` or pickled files."
  },
  {
   "label": "save",
   "type": "function",
   "signature": "save(file, arr, allow_pickle=True, fix_imports=<no value>)",
   "doc": "Save an array to a binary file in NumPy ``.npy`` format."
  },
  {
   "label": "savez",
   "type": "function",
   "signature": "savez(file, *args, allow_pickle=True, **kwds)",
   "doc": "Save several arrays into a single file in uncompressed ``.npz`` format."
  },
  {
   "label": "savetxt",
   "type": "function",
   "signature": "savetxt(fname, X, fmt='%.18e', delimiter=' ', newline='\\n', header='', footer='', comments='# ', encoding=None)",
   "doc": "Save an array to a text file."
  },
  {
   "label": "loadtxt",
   "type": "function",
   "signature": "loadtxt(fname, dtype=<class 'float'>, comments='#', delimiter=None, converters=None, skiprows=0, usecols=None, unpack=False, ndmin=0, encoding=None, max_rows=None, *, quotechar=None, like=None)",
   "doc": "Load data from a text file."
  },
  {
   "label": "genfromtxt",
   "type": "function",
   "signature": "genfromtxt(fname, dtype=<class 'float'>, comments='#', delimiter=None, skip_header=0, skip_footer=0, converters=None, missing_values=None, filling_values=None, usecols=None, names=None, excludelist=None, deletechars=\" !#$%&'()*+,-./:;<=>?@[\\\\]^{|}~\", replace_space='_', autostrip=False, case_sensitive=True, defaultfmt='f%i', unpack=None, usemask=False, loose=True, invalid_raise=True, max_rows=None,",
   "doc": "Load data from a text file, with missing values handled as specified."
  },
  {
   "label": "meshgrid",
   "type": "function",
   "signature": "meshgrid(*xi, copy=True, sparse=False, indexing='xy')",
   "doc": "Return a tuple of coordinate matrices from coordinate vectors."
  },
  {
   "label": "broadcast_to",
   "type": "function",
   "signature": "broadcast_to(array, shape, subok=False)",
   "doc": "Broadcast an array to a new shape."
  },
  {
   "label": "repeat",
   "type": "function",
   "signature": "repeat(a, repeats, axis=None)",
   "doc": "Repeat each element of an array after themselves"
  },
  {
   "label": "tile",
   "type": "function",
   "signature": "tile(A, reps)",
   "doc": "Construct an array by repeating A the number of times given by reps."
  },
  {
   "label": "diff",
   "type": "function",
   "signature": "diff(a, n=1, axis=-1, prepend=<no value>, append=<no value>)",
   "doc": "Calculate the n-th discrete difference along the given axis."
  },
  {
   "label": "gradient",
   "type": "function",
   "signature": "gradient(f, *varargs, axis=None, edge_order=1)",
   "doc": "Return the gradient of an N-dimensional array."
  },
  {
   "label": "pi",
   "type": "constant",
   "signature": "pi",
   "doc": "NumPy pi"
  },
  {
   "label": "e",
   "type": "constant",
   "signature": "e",
   "doc": "NumPy e"
  },
  {
   "label": "inf",
   "type": "constant",
   "signature": "inf",
   "doc": "NumPy inf"
  },
  {
   "label": "nan",
   "type": "constant",
   "signature": "nan",
   "doc": "NumPy nan"
  },
  {
   "label": "newaxis",
   "type": "constant",
   "signature": "newaxis",
   "doc": "NumPy newaxis"
  },
  {
   "label": "float32",
   "type": "constant",
   "signature": "float32",
   "doc": "NumPy float32"
  },
  {
   "label": "float64",
   "type": "constant",
   "signature": "float64",
   "doc": "NumPy float64"
  },
  {
   "label": "int32",
   "type": "constant",
   "signature": "int32",
   "doc": "NumPy int32"
  },
  {
   "label": "int64",
   "type": "constant",
   "signature": "int64",
   "doc": "NumPy int64"
  },
  {
   "label": "uint8",
   "type": "constant",
   "signature": "uint8",
   "doc": "NumPy uint8"
  },
  {
   "label": "linalg",
   "type": "namespace",
   "signature": "linalg",
   "doc": "NumPy linear algebra functions"
  }
 ],
 "numpy.linalg": [
  {
   "label": "norm",
   "type": "function",
   "signature": "norm(x, ord=None, axis=None, keepdims=False)",
   "doc": "Matrix or vector norm."
  },
  {
   "label": "inv",
   "type": "function",
   "signature": "inv(a)",
   "doc": "Compute the inverse of a matrix."
  },
  {
   "label": "solve",
   "type": "function",
   "signature": "solve(a, b)",
   "doc": "Solve a linear matrix equation, or system of linear scalar equations."
  },
  {
   "label": "lstsq",
   "type": "function",
   "signature": "lstsq(a, b, rcond=None)",
   "doc": "Return the least-squares solution to a linear matrix equation."
  },
  {
   "label": "eig",
   "type": "function",
   "signature": "eig(a)",
   "doc": "Compute the eigenvalues and right eigenvectors of a square array."
  },
  {
   "label": "eigh",
   "type": "function",
   "signature": "eigh(a, UPLO='L')",
   "doc": "Return the eigenvalues and eigenvectors of a complex Hermitian"
  },
  {
   "label": "svd",
   "type": "function",
   "signature": "svd(a, full_matrices=True, compute_uv=True, hermitian=False)",
   "doc": "Singular Value Decomposition."
  },
  {
   "label": "det",
   "type": "function",
   "signature": "det(a)",
   "doc": "Compute the determinant of an array."
  },
  {
   "label": "matrix_rank",
   "type": "function",
   "signature": "matrix_rank(A, tol=None, hermitian=False, *, rtol=None)",
   "doc": "Return matrix rank of array using SVD method"
  },
  {
   "label": "pinv",
   "type": "function",
   "signature": "pinv(a, rcond=None, hermitian=False, *, rtol=<no value>)",
   "doc": "Compute the (Moore-Penrose) pseudo-inverse of a matrix."
  }
 ],
 "ndarray": [
  {
   "label": "reshape",
   "type": "function",
   "signature": "reshape(...)",
   "doc": "a.reshape(shape, /, *, order='C', copy=None)"
  },
  {
   "label": "ravel",
   "type": "function",
   "signature": "ravel(...)",
   "doc": "a.ravel([order])"
  },
  {
   "label": "flatten",
   "type": "function",
   "signature": "flatten(...)",
   "doc": "a.flatten(order='C')"
  },
  {
   "label": "transpose",
   "type": "function",
   "signature": "transpose(...)",
   "doc": "a.transpose(*axes)"
  },
  {
   "label": "astype",
   "type": "function",
   "signature": "astype(...)",
   "doc": "a.astype(dtype, order='K', casting='unsafe', subok=True, copy=True)"
  },
  {
   "label": "copy",
   "type": "function",
   "signature": "copy(...)",
   "doc": "a.copy(order='C')"
  },
  {
   "label": "sum",
   "type": "function",
   "signature": "sum(...)",
   "doc": "a.sum(axis=None, dtype=None, out=None, keepdims=False, initial=0, where=True)"
  },
  {
   "label": "mean",
   "type": "function",
   "signature": "mean(...)",
   "doc": "a.mean(axis=None, dtype=None, out=None, keepdims=False, *, where=True)"
  },
  {
   "label": "std",
   "type": "function",
   "signature": "std(...)",
   "doc": "a.std(axis=None, dtype=None, out=None, ddof=0, keepdims=False, *, where=True)"
  },
  {
   "label": "min",
   "type": "function",
   "signature": "min(...)",
   "doc": "a.min(axis=None, out=None, keepdims=False, initial=<no value>, where=True)"
  },
  {
   "label": "max",
   "type": "function",
   "signature": "max(...)",
   "doc": "a.max(axis=None, out=None, keepdims=False, initial=<no value>, where=True)"
  },
  {
   "label": "argmin",
   "type": "function",
   "signature": "argmin(...)",
   "doc": "a.argmin(axis=None, out=None, *, keepdims=False)"
  },
  {
   "label": "argmax",
   "type": "function",
   "signature": "argmax(...)",
   "doc": "a.argmax(axis=None, out=None, *, keepdims=False)"
  },
  {
   "label": "tolist",
   "type": "function",
   "signature": "tolist(...)",
   "doc": "a.tolist()"
  },
  {
   "label": "item",
   "type": "function",
   "signature": "item(...)",
   "doc": "a.item(*args)"
  },
  {
   "label": "shape",
   "type": "property",
   "signature": "shape",
   "doc": "Tuple of array dimensions."
  },
  {
   "label": "ndim",
   "type": "property",
   "signature": "ndim",
   "doc": "Number of array dimensions."
  },
  {
   "label": "size",
   "type": "property",
   "signature": "size",
   "doc": "Number of elements in the array."
  },
  {
   "label": "dtype",
   "type": "property",
   "signature": "dtype",
   "doc": "Data-type of the array's elements."
  },
  {
   "label": "T",
   "type": "property",
   "signature": "T",
   "doc": "View of the transposed array."
  }
 ],
 "builtins": [
  {
   "label": "print",
   "type": "function",
   "signature": "print(*args, sep=' ', end='\\n', file=None, flush=False)",
   "doc": "Prints the values to a stream, or to sys.stdout by default."
  },
  {
   "label": "len",
   "type": "function",
   "signature": "len(obj, /)",
   "doc": "Return the number of items in a container."
  },
  {
   "label": "range",
   "type": "function",
   "signature": "range(stop) -> range object",
   "doc": "Return an object that produces a sequence of integers from start (inclusive)"
  },
  {
   "label": "enumerate",
   "type": "function",
   "signature": "enumerate(iterable, start=0)",
   "doc": "Return an enumerate object."
  },
  {
   "label": "zip",
   "type": "function",
   "signature": "zip(*iterables, strict=False)",
   "doc": "The zip object yields n-length tuples, where n is the number of iterables"
  },
  {
   "label": "list",
   "type": "function",
   "signature": "list(iterable=(), /)",
   "doc": "Built-in mutable sequence."
  },
  {
   "label": "dict",
   "type": "function",
   "signature": "dict() -> new empty dictionary",
   "doc": "dict(mapping) -> new dictionary initialized from a mapping object's"
  },
  {
   "label": "set",
   "type": "function",
   "signature": "set(iterable=(), /)",
   "doc": "Build an unordered collection of unique elements."
  },
  {
   "label": "tuple",
   "type": "function",
   "signature": "tuple(iterable=(), /)",
   "doc": "Built-in immutable sequence."
  },
  {
   "label": "str",
   "type": "function",
   "signature": "str(object='') -> str",
   "doc": "Create a new string object from the given object. If encoding or"
  },
  {
   "label": "int",
   "type": "function",
   "signature": "int([x]) -> integer",
   "doc": "Convert a number or string to an integer, or return 0 if no arguments"
  },
  {
   "label": "float",
   "type": "function",
   "signature": "float(x=0, /)",
   "doc": "Convert a string or number to a floating-point number, if possible."
  },
  {
   "label": "bool",
   "type": "function",
   "signature": "bool(object=False, /)",
   "doc": "Returns True when the argument is true, False otherwise."
  },
  {
   "label": "sum",
   "type": "function",
   "signature": "sum(iterable, /, start=0)",
   "doc": "Return the sum of a 'start' value (default: 0) plus an iterable of numbers"
  },
  {
   "label": "min",
   "type": "function",
   "signature": "min(iterable, *[, default=obj, key=func]) -> value",
   "doc": "With a single iterable argument, return its smallest item. The"
  },
  {
   "label": "max",
   "type": "function",
   "signature": "max(iterable, *[, default=obj, key=func]) -> value",
   "doc": "With a single iterable argument, return its biggest item. The"
  },
  {
   "label": "sorted",
   "type": "function",
   "signature": "sorted(iterable, /, *, key=None, reverse=False)",
   "doc": "Return a new list containing all items from the iterable in ascending order."
  },
  {
   "label": "abs",
   "type": "function",
   "signature": "abs(x, /)",
   "doc": "Return the absolute value of the argument."
  },
  {
   "label": "round",
   "type": "function",
   "signature": "round(number, ndigits=None)",
   "doc": "Round a number to a given precision in decimal digits."
  },
  {
   "label": "isinstance",
   "type": "function",
   "signature": "isinstance(obj, class_or_tuple, /)",
   "doc": "Return whether an object is an instance of a class or of a subclass thereof."
  },
  {
   "label": "open",
   "type": "function",
   "signature": "open(file, mode='r', buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None)",
   "doc": "Open file and return a stream.  Raise OSError upon failure."
  }
 ]
};
