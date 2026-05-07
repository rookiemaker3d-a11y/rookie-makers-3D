// --- PARÁMETROS AJUSTABLES (en mm) ---
// Estas variables definen el tamaño físico final
diametro_bola = 20;     // Exactamente 2cm
diametro_poste = 10;    // Exactamente 1cm
resolucion = 128;       // Alta calidad para esferas muy lisas

// Proporciones originales para mantener la forma triclínica
a_prop = 50; b_prop = 60; c_prop = 70;

alpha = 80; beta = 70; gamma = 75;

// --- CÁLCULOS GEOMÉTRICOS ---
// Ángulos triclínicos
ax_p = a_prop; ay_p = 0; az_p = 0;
bx_p = b_prop * cos(gamma); by_p = b_prop * sin(gamma); bz_p = 0;
cx_p = c_prop * cos(beta);
cy_p = c_prop * (cos(alpha) - cos(beta)*cos(gamma)) / sin(gamma);
cz_p = sqrt(pow(c_prop,2) - pow(cx_p,2) - pow(cy_p,2));

// Puntos proporcionales
V0_p = [0,0,0]; Va_p = [ax_p,ay_p,az_p]; Vb_p = [bx_p,by_p,bz_p]; Vc_p = [cx_p,cy_p,cz_p];
Vab_p = [ax_p+bx_p, ay_p+by_p, az_p+bz_p]; Vac_p = [ax_p+cx_p, ay_p+cy_p, az_p+cz_p];
Vbc_p = [bx_p+cx_p, by_p+cy_p, bz_p+cz_p]; Vabc_p = [ax_p+bx_p+cx_p, ay_p+by_p+cy_p, az_p+bz_p+cz_p];

// ESCALADO PARA ALTURA TOTAL 100mm (10cm)
// El punto más alto de la geometría es Vabc. Usamos su CZ para escalar.
cz_max = Vac_p[2] + diametro_bola/2; // Altura del punto de arriba + radio de la bola
factor_escala = 100 / cz_max;

// Puntos escalados (estos son los finales)
V0 = V0_p * factor_escala; Va = Va_p * factor_escala; Vb = Vb_p * factor_escala; Vc = Vc_p * factor_escala;
Vab = Vab_p * factor_escala; Vac = Vac_p * factor_escala; Vbc = Vbc_p * factor_escala; Vabc = Vabc_p * factor_escala;

// --- MÓDULOS ---
module atomo(pos) {
    translate(pos) sphere(d=diametro_bola, $fn=resolucion);
}

module poste(p1, p2) {
    hull() {
        translate(p1) sphere(d=diametro_poste, $fn=32);
        translate(p2) sphere(d=diametro_poste, $fn=32);
    }
}

// --- RENDERIZADO ---
union() {
    // Dibujar Átomos (Bolas 2cm)
    atomo(V0); atomo(Va); atomo(Vb); atomo(Vc);
    atomo(Vab); atomo(Vac); atomo(Vbc); atomo(Vabc);

    // Dibujar Uniones (Postes 1cm)
    poste(V0, Va); poste(V0, Vb); poste(V0, Vc);
    poste(Va, Vab); poste(Va, Vac);
    poste(Vb, Vab); poste(Vb, Vbc);
    poste(Vc, Vac); poste(Vc, Vbc);
    poste(Vab, Vabc); poste(Vac, Vabc); poste(Vbc, Vabc);
}