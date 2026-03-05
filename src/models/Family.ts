export interface FamilyMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: 'M' | 'F';
    class: 'Y1' | 'Y2' | 'Y3' | 'Parent';
    role?: 'Pere' | 'Mere';
}

export interface Family {
    id: string;
    name: string;
    generation: string;
    total_members?: number;
    total_boys?: number;
    total_girls?: number;
    total_y1?: number;
    total_y2?: number;
    total_y3?: number;
    pere?: FamilyMember;
    mere?: FamilyMember;
    members: FamilyMember[];
}
