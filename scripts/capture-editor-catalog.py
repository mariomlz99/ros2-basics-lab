import inspect,json,pathlib,numpy as np,builtins
names='array asarray arange linspace logspace zeros zeros_like ones ones_like empty empty_like full full_like eye identity concatenate stack hstack vstack dstack column_stack split hsplit vsplit reshape ravel transpose moveaxis squeeze expand_dims append insert delete where nonzero argwhere sort argsort unique sum mean median std var min max argmin argmax dot matmul cross einsum sqrt exp log sin cos tan abs clip round isclose allclose isnan isinf all any load save savez savetxt loadtxt genfromtxt meshgrid broadcast_to repeat tile diff gradient'.split()
def record(name,obj):
 doc=inspect.getdoc(obj) or '';lines=doc.splitlines();first=lines[0] if lines else name
 try:sig=name+str(inspect.signature(obj))
 except (ValueError,TypeError):sig=first if first.startswith(name+'(') else name+'(...)'
 if name=='concatenate':sig="concatenate(arrays, axis=0, out=None, *, dtype=None, casting='same_kind')"
 summary=next((line.strip() for line in lines if line.strip() and not line.startswith(name+'(') and not line.startswith(' ')),first)
 if summary==first and first.startswith(name+'('):summary=next((line.strip() for line in lines[1:] if line.strip()),'')
 return {'label':name,'type':'function' if callable(obj) else 'variable','signature':sig[:400],'doc':summary[:350]}
data={'numpy': [record(n,getattr(np,n)) for n in names], 'numpy.linalg':[record(n,getattr(np.linalg,n)) for n in ['norm','inv','solve','lstsq','eig','eigh','svd','det','matrix_rank','pinv']], 'ndarray':[record(n,getattr(np.ndarray,n)) for n in ['reshape','ravel','flatten','transpose','astype','copy','sum','mean','std','min','max','argmin','argmax','tolist','item']], 'builtins':[record(n,getattr(builtins,n)) for n in ['print','len','range','enumerate','zip','list','dict','set','tuple','str','int','float','bool','sum','min','max','sorted','abs','round','isinstance','open']]}
for n in ['shape','ndim','size','dtype','T']:data['ndarray'].append({'label':n,'type':'property','signature':n,'doc':(inspect.getdoc(getattr(np.ndarray,n)) or '').splitlines()[0]})
data['numpy'] += [{'label':n,'type':'constant','signature':n,'doc':'NumPy '+n} for n in ['pi','e','inf','nan','newaxis','float32','float64','int32','int64','uint8']]
data['numpy'].append({'label':'linalg','type':'namespace','signature':'linalg','doc':'NumPy linear algebra functions'})
json.dumps({'numpyVersion':np.__version__,'data':data},ensure_ascii=False)
